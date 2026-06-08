import { COOKIE_NAME, CATEGORY_LABELS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRegistration, getAllRegistrations, getRegistrationsByCategory, getRegistrationStats, searchRegistrations, filterRegistrations, searchAndFilterRegistrations } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { generateImage } from "./_core/imageGeneration";
import { generateRegistrationPDF, generateParentalConsentPDF } from "./_core/pdfGenerator";
import { generateCertificate } from "./_core/certificateGenerator";
import { generateEnhancedCertificate } from "./_core/enhancedCertificateGenerator";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
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

          // Filter by category if provided
          if (input.category) {
            registrations = registrations.filter(r => r.category === input.category);
          }

          // Filter by search query (name or talents)
          if (input.search) {
            const query = input.search.toLowerCase();
            registrations = registrations.filter(r =>
              r.fullName.toLowerCase().includes(query) ||
              (r.talents && r.talents.toLowerCase().includes(query))
            );
          }

          // Return only public-safe fields
          return registrations
            .filter(r => r.photoUrl && r.consentPhotoVideo) // Only show if they consented
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
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch gallery",
          });
        }
      }),
  }),

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
          consentPhotoVideo: z.boolean().default(false),
          consentDataProcessing: z.boolean().default(false),
          consentTerms: z.boolean().default(false),
          parentalConsentSigned: z.boolean().optional(),
          parentalConsentUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await createRegistration(input);
        
        // Generate PDFs asynchronously (don't block the response)
        setImmediate(async () => {
          try {
            const mockRegistration = {
              id,
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
        
        return { success: true, registrationId: id.toString() };
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
          const categoryLabel = CATEGORY_LABELS[input.category];
          const prompt = `Create a glamorous event poster for a modeling competition. The image should feature the photo provided, with the following text overlaid: Name: ${input.fullName}, Category: ${categoryLabel}, Event: Mr & Miss Face of Tharaka-Nithi County 2026. Use burgundy and gold colors. Make it professional and elegant.`;

          const posterImage = await generateImage({
            prompt,
            originalImages: [
              {
                url: input.photoUrl,
                mimeType: "image/jpeg",
              },
            ],
          });

          return { success: true, posterUrl: posterImage.url };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate poster",
          });
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
          const categoryLabel = CATEGORY_LABELS[input.category];

          const pdfBuffer = await generateEnhancedCertificate({
            participantName: input.participantName,
            category: categoryLabel,
            registrationId: input.registrationId,
            eventDate: input.eventDate,
            venue: input.venue,
            partners: ["Royals Icon Events", "Tharaka-Nithi County"],
          });

          const fileName = `certificate_${input.registrationId}_${Date.now()}.pdf`;
          const { url, key } = await storagePut(
            `certificates/${fileName}`,
            pdfBuffer,
            "application/pdf"
          );

          return { success: true, certificateUrl: url, certificateKey: key };
        } catch (error) {
          console.error("Certificate generation error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate certificate",
          });
        }
      }),
  }),

  admin: router({
    getRegistrationsByCategory: protectedProcedure
      .input(z.enum(["adults", "teens", "little_stars"]))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        return await getRegistrationsByCategory(input);
      }),

    getAllRegistrations: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      return await getAllRegistrations();
    }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      return await getRegistrationStats();
    }),

    search: protectedProcedure
      .input(z.string())
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        return await searchRegistrations(input);
      }),

    filter: protectedProcedure
      .input(
        z.object({
          category: z.enum(["adults", "teens", "little_stars"]).optional(),
          paymentStatus: z.enum(["pending", "completed"]).optional(),
          ageMin: z.number().optional(),
          ageMax: z.number().optional(),
          county: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        return await filterRegistrations(input);
      }),

    searchAndFilter: protectedProcedure
      .input(
        z.object({
          query: z.string().default(""),
          filters: z.object({
            category: z.enum(["adults", "teens", "little_stars"]).optional(),
            paymentStatus: z.enum(["pending", "completed"]).optional(),
            ageMin: z.number().optional(),
            ageMax: z.number().optional(),
            county: z.string().optional(),
          }).optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        return await searchAndFilterRegistrations(input.query, input.filters || {});
      }),
  }),
});

export type AppRouter = typeof appRouter;
