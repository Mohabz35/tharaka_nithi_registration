import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createRegistration, getAllRegistrations, getRegistrationById, getRegistrationsByCategory,
  getRegistrationStats, searchRegistrations, filterRegistrations, searchAndFilterRegistrations,
  createEventSponsor, getAllEventSponsors, deleteEventSponsor,
  createArtistRegistration, getAllArtistRegistrations, deleteArtistRegistration,
  createShowcaseRegistration, getAllShowcaseRegistrations, deleteShowcaseRegistration,
  getSiteSettings, upsertSiteSetting,
  getPartnerLogos, createPartnerLogo, togglePartnerLogoStatus, deletePartnerLogo,
} from "./db.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc.js";
import { systemRouter } from "./_core/systemRouter.js";
import { generateImage } from "./_core/imageGeneration.js";
import { generateRegistrationPDF, generateParentalConsentPDF } from "./_core/pdfGenerator.js";
import { generateCertificate } from "./_core/certificateGenerator.js";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  gallery: router({
    getPublicRegistrations: publicProcedure
      .input(
        z.object({
          category: z.enum(["adults", "teens", "little_stars"]).optional(),
          search: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        try {
          let registrations = await getAllRegistrations();
          if (input.category) {
            registrations = registrations.filter(r => r.category === input.category);
          }
          if (input.search) {
            const query = input.search.toLowerCase();
            registrations = registrations.filter(r =>
              r.fullName.toLowerCase().includes(query) ||
              (r.talents && r.talents.toLowerCase().includes(query))
            );
          }
          return registrations
            .filter(r => r.photoUrl && r.consentPhotoVideo)
            .map(r => ({
              id: r.id,
              fullName: r.fullName,
              category: r.category,
              age: r.age,
              talents: r.talents,
              photoUrl: r.photoUrl,
              posterUrl: r.posterUrl,
              registrationDate: r.registrationDate,
            }));
        } catch (error) {
          console.error("Gallery fetch error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch gallery" });
        }
      }),
  }),

  // ============ Public Site Settings ============
  siteSettings: router({
    getAll: publicProcedure.query(async () => {
      try {
        const settings = await getSiteSettings();
        const result: Record<string, string> = {};
        settings.forEach(s => { if (s.value) result[s.key] = s.value; });
        return result;
      } catch {
        return {};
      }
    }),
  }),

  // ============ Model Registration ============
  registration: router({
    submit: publicProcedure
      .input(
        z.object({
          fullName: z.string().min(1, "Full name is required"),
          dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
          age: z.number().int().min(5).max(26),
          category: z.enum(["adults", "teens", "little_stars"]),
          phoneNumber: z.string().min(9, "Phone number is required"),
          email: z.string().email("Invalid email"),
          countySubLocation: z.string().min(1, "County sub-location is required"),
          photoUrl: z.string().optional(),
          photoKey: z.string().optional(),
          talents: z.string().optional(),
          portfolioUrl: z.string().optional(),
          portfolioKey: z.string().optional(),
          socialMediaHandles: z.string().optional(), // JSON string
          consentPhotoVideo: z.boolean().default(false),
          consentDataProcessing: z.boolean().default(false),
          consentTerms: z.boolean().default(false),
          parentalConsentSigned: z.boolean().optional(),
          parentalConsentUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const insertId = await createRegistration(input);
        const registrationId = `REG-${insertId.toString().padStart(3, '0')}`;

        // Generate PDFs asynchronously (don't block the response)
        setImmediate(async () => {
          try {
            const mockRegistration = {
              id: insertId,
              ...input,
              paymentStatus: "pending" as const,
              registrationDate: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
              posterUrl: null,
              posterKey: null,
            } as any;

            await generateRegistrationPDF(mockRegistration);

            if (input.category !== "adults" && input.parentalConsentSigned) {
              await generateParentalConsentPDF(mockRegistration);
            }
          } catch (error) {
            console.error("Error generating PDFs:", error);
          }
        });

        return { success: true, registrationId };
      }),

    generatePoster: publicProcedure
      .input(
        z.object({
          photoUrl: z.string(),
          fullName: z.string(),
          category: z.enum(["adults", "teens", "little_stars"]),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const categoryLabel = input.category === "adults" ? "Adults (18-26)" : input.category === "teens" ? "Teens (13-17)" : "Little Stars (5-12)";
          const prompt = `Create a glamorous event poster for a modeling competition. The image should feature the photo provided, with the following text overlaid: Name: ${input.fullName}, Category: ${categoryLabel}, Event: Mr & Miss Face of Tharaka-Nithi County 2026. Use burgundy and gold colors. Make it professional and elegant.`;

          const posterImage = await generateImage({
            prompt,
            originalImages: [{ url: input.photoUrl, mimeType: "image/jpeg" }],
          });

          return { success: true, posterUrl: posterImage.url };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate poster" });
        }
      }),

    downloadCertificate: publicProcedure
      .input(
        z.object({
          participantName: z.string(),
          category: z.enum(["adults", "teens", "little_stars"]),
          registrationId: z.string(),
          eventDate: z.string().default("September 12, 2026"),
          venue: z.string().default("Chuka Grounds"),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const { url, key } = await generateCertificate({
            participantName: input.participantName,
            category: input.category,
            registrationId: input.registrationId,
            registrationDate: new Date(),
            eventDate: input.eventDate,
            venue: input.venue,
          });
          return { success: true, certificateUrl: url, certificateKey: key };
        } catch (error) {
          console.error("Certificate generation error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate certificate" });
        }
      }),

    downloadRegistrationPdf: publicProcedure
      .input(
        z.object({
          registrationId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const registration = await getRegistrationById(input.registrationId);
          if (!registration) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Registration not found" });
          }

          const { url, key } = await generateRegistrationPDF(registration);
          return { success: true, pdfUrl: url, pdfKey: key };
        } catch (error) {
          console.error("PDF generation error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate PDF" });
        }
      }),
  }),

  // ============ Sponsor/Partner Registration ============
  sponsor: router({
    register: publicProcedure
      .input(
        z.object({
          fullName: z.string().min(1),
          organizationName: z.string().optional(),
          email: z.string().email(),
          phoneNumber: z.string().min(9),
          sponsorType: z.enum(["sponsor", "partner"]),
          message: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await createEventSponsor(input);
        return { success: true, id };
      }),
  }),

  // ============ Artist Registration ============
  artist: router({
    register: publicProcedure
      .input(
        z.object({
          fullName: z.string().min(1),
          stageName: z.string().optional(),
          email: z.string().email(),
          phoneNumber: z.string().min(9),
          artType: z.string().min(1),
          socialMediaHandles: z.string().optional(),
          message: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await createArtistRegistration(input);
        return { success: true, id };
      }),
  }),

  // ============ Showcase Registration ============
  showcase: router({
    register: publicProcedure
      .input(
        z.object({
          fullName: z.string().min(1),
          businessName: z.string().optional(),
          email: z.string().email(),
          phoneNumber: z.string().min(9),
          showcaseType: z.string().min(1),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await createShowcaseRegistration(input);
        return { success: true, id };
      }),
  }),

  // ============ Admin ============
  admin: router({
    // Model registrations
    getRegistrationsByCategory: protectedProcedure
      .input(z.enum(["adults", "teens", "little_stars"]))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        return await getRegistrationsByCategory(input);
      }),

    getAllRegistrations: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      return await getAllRegistrations();
    }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      return await getRegistrationStats();
    }),

    search: protectedProcedure
      .input(z.string())
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        return await searchRegistrations(input);
      }),

    filter: protectedProcedure
      .input(z.object({
        category: z.enum(["adults", "teens", "little_stars"]).optional(),
        paymentStatus: z.enum(["pending", "completed"]).optional(),
        ageMin: z.number().optional(),
        ageMax: z.number().optional(),
        county: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        return await filterRegistrations(input);
      }),

    searchAndFilter: protectedProcedure
      .input(z.object({
        query: z.string().default(""),
        filters: z.object({
          category: z.enum(["adults", "teens", "little_stars"]).optional(),
          paymentStatus: z.enum(["pending", "completed"]).optional(),
          ageMin: z.number().optional(),
          ageMax: z.number().optional(),
          county: z.string().optional(),
        }).optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        return await searchAndFilterRegistrations(input.query, input.filters || {});
      }),

    // Partner Logos
    getPartnerLogos: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      return await getPartnerLogos();
    }),

    createPartnerLogo: protectedProcedure
      .input(z.object({ name: z.string(), logoUrl: z.string(), logoKey: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        await createPartnerLogo(input);
        return { success: true };
      }),

    togglePartnerLogoStatus: protectedProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        await togglePartnerLogoStatus(input.id, input.isActive);
        return { success: true };
      }),

    deletePartnerLogo: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        await deletePartnerLogo(input);
        return { success: true };
      }),

    // Sponsor registrations
    getSponsors: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      return await getAllEventSponsors();
    }),

    deleteSponsor: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        await deleteEventSponsor(input);
        return { success: true };
      }),

    // Artist registrations
    getArtists: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      return await getAllArtistRegistrations();
    }),

    deleteArtist: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        await deleteArtistRegistration(input);
        return { success: true };
      }),

    // Showcase registrations
    getShowcases: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      return await getAllShowcaseRegistrations();
    }),

    deleteShowcase: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        await deleteShowcaseRegistration(input);
        return { success: true };
      }),

    // Site settings (social media links)
    getSiteSettings: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      return await getSiteSettings();
    }),

    updateSiteSetting: protectedProcedure
      .input(z.object({ key: z.string(), value: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        await upsertSiteSetting(input.key, input.value);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
