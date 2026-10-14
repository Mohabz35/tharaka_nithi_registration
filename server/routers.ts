import { COOKIE_NAME, SUPPORT_EMAIL } from "../shared/const.js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createRegistration, getAllRegistrations, getRegistrationById, getRegistrationsByCategory,
  getRegistrationStats, searchRegistrations, filterRegistrations, searchAndFilterRegistrations,
  deleteRegistration, updateRegistration,
  createEventSponsor, getAllEventSponsors, deleteEventSponsor,
  createArtistRegistration, getAllArtistRegistrations, deleteArtistRegistration,
  createShowcaseRegistration, getAllShowcaseRegistrations, deleteShowcaseRegistration,
  getSiteSettings, getSiteSetting, upsertSiteSetting,
  getPartnerLogos, createPartnerLogo, togglePartnerLogoStatus, deletePartnerLogo,
  createWinner, getAllWinners, getPublishedWinners, getWinnerById, updateWinner, deleteWinner, toggleWinnerPublish,
  createEvent, getAllEvents, getPublishedEvents, getEventBySlug, getEventById, updateEvent, deleteEvent, toggleEventPublish,
  getEventPhotos, createEventPhotos, deleteEventPhoto,
  createTrainingProgram, getAllTrainingPrograms, getActiveTrainingPrograms, getTrainingProgramById,
  updateTrainingProgram, deleteTrainingProgram, toggleTrainingProgramActive,
  createTrainingRegistration, getTrainingRegistrationCount, getAllTrainingRegistrations,
  updateTrainingRegistrationPayment, deleteTrainingRegistration,
} from "./db.js";
import { REGISTRATION_DEADLINE_ISO } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc.js";
import { systemRouter } from "./_core/systemRouter.js";
import { generateImage } from "./_core/imageGeneration.js";
import { generateRegistrationPDF, generateParentalConsentPDF } from "./_core/pdfGenerator.js";
import { generateCertificate } from "./_core/certificateGenerator.js";
import { storageGetSignedUrl } from "./storage.js";
import { sendEmail, buildCertificateEmail, buildRegistrationEmail, buildRegistrationConfirmationEmail, buildDocumentConfirmationEmail, buildTrainingRegistrationEmail } from "./_core/emailService.js";
import { contestantRouter } from "./contestant.js";
import { merchandiseRouter } from "./merchandiseRouter.js";

export const appRouter = router({
  system: systemRouter,
  contestant: contestantRouter,
  merchandise: merchandiseRouter,
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
          const result = await searchAndFilterRegistrations(
            input.search || "", 
            {
              category: input.category,
              hasPhoto: true
            },
            1, // page
            500 // limit (fetch more for gallery since no pagination UI exists)
          );
          
          return result.data.map(r => ({
              id: r.id,
              fullName: r.fullName,
              category: r.category,
              age: r.age,
              talents: r.talents,
              photoUrl: r.photoUrl,
              posterUrl: r.posterUrl,
              countySubLocation: r.countySubLocation,
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
          age: z.number().int().min(5).max(35),
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
          documentUrl: z.string().optional(),
          documentKey: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Enforce registration window (admin-configurable)
        try {
          const closedSetting = await getSiteSetting("registration_closed");
          if (closedSetting === "true") {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Registration is currently closed. Please check back later.",
            });
          }
          const deadlineSetting = await getSiteSetting("registration_deadline");
          const deadlineIso = deadlineSetting || REGISTRATION_DEADLINE_ISO;
          if (new Date(deadlineIso).getTime() < Date.now()) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Registration has closed. The deadline has passed.",
            });
          }
        } catch (err) {
          if (err instanceof TRPCError) throw err;
          // If settings can't be read, fall back to allowing registration
        }

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

            // Send a confirmation email to the registrant
            try {
              const confirmation = buildRegistrationConfirmationEmail(input.fullName);
              await sendEmail({ to: input.email, ...confirmation });
            } catch (emailErr) {
              console.error("[Registration] Confirmation email failed:", emailErr);
            }

            // If documents were uploaded, notify the organizing team for manual confirmation
            if (input.documentUrl) {
              try {
                const docNotify = buildDocumentConfirmationEmail(
                  input.fullName,
                  input.category,
                  input.documentUrl
                );
                await sendEmail({ to: SUPPORT_EMAIL, ...docNotify });
              } catch (emailErr) {
                console.error("[Registration] Document notification failed:", emailErr);
              }
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
          const categoryLabel = input.category === "adults" ? "Adults (18-35)" : input.category === "teens" ? "Teens (13-17)" : "Little Stars (5-12)";
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
          // Use signed URL to avoid 401 on Cloudinary raw files
          const signedUrl = await storageGetSignedUrl(key);
          return { success: true, certificateUrl: signedUrl, certificateKey: key };
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
          // Use signed URL to avoid 401 on Cloudinary raw files
          const signedUrl = await storageGetSignedUrl(key);
          return { success: true, pdfUrl: signedUrl, pdfKey: key };
        } catch (error) {
          console.error("PDF generation error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate PDF" });
        }
      }),
  }),

  // ============ Model Profile ============
  modelProfile: router({
    // Look up registration by email
    getByEmail: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .query(async ({ input }) => {
        try {
          const { getDb } = await import("./db.js");
          const { registrations } = await import("../drizzle/schema.js");
          const { ilike } = await import("drizzle-orm");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

          const results = await db.select().from(registrations).where(ilike(registrations.email, input.email));
          if (results.length === 0) {
            throw new TRPCError({ code: "NOT_FOUND", message: "No registration found with this email" });
          }

          return results.map((r: any) => ({
            ...r,
            registrationId: `REG-${r.id.toString().padStart(3, '0')}`,
          }));
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to look up registration" });
        }
      }),

    // Update category
    updateCategory: publicProcedure
      .input(z.object({
        email: z.string().email(),
        registrationId: z.number(),
        category: z.enum(["adults", "teens", "little_stars"]),
      }))
      .mutation(async ({ input }) => {
        try {
          const { updateRegistration } = await import("./db.js");
          await updateRegistration(input.registrationId, { category: input.category });
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update category" });
        }
      }),

    // Update profile fields
    updateProfile: publicProcedure
      .input(z.object({
        registrationId: z.number(),
        fullName: z.string().optional(),
        phoneNumber: z.string().optional(),
        email: z.string().email().optional(),
        countySubLocation: z.string().optional(),
        talents: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { updateRegistration } = await import("./db.js");
          const { registrationId, ...data } = input;
          await updateRegistration(registrationId, data);
          return { success: true };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update profile" });
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

    addRegistration: protectedProcedure
      .input(
        z.object({
          fullName: z.string().min(1),
          category: z.enum(["adults", "teens", "little_stars"]),
          age: z.number(),
          phoneNumber: z.string(),
          email: z.string(),
          countySubLocation: z.string(),
          talents: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        
        // Default values for an admin-added contestant
        const registrationData = {
          ...input,
          dateOfBirth: new Date(new Date().getFullYear() - input.age, 0, 1).toISOString().split('T')[0], // Estimate DOB based on age
          paymentStatus: "completed" as const,
          consentPhotoVideo: true,
          consentDataProcessing: true,
          consentTerms: true,
        };

        const id = await createRegistration(registrationData);
        return { success: true, id };
      }),

    deleteRegistration: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        return await deleteRegistration(input);
      }),

    updateRegistration: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          fullName: z.string().optional(),
          dateOfBirth: z.string().optional(),
          age: z.number().optional(),
          category: z.enum(["adults", "teens", "little_stars"]).optional(),
          phoneNumber: z.string().optional(),
          email: z.string().optional(),
          countySubLocation: z.string().optional(),
          talents: z.string().optional(),
          socialMediaHandles: z.string().optional(),
          paymentStatus: z.enum(["pending", "completed"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        const { id, ...data } = input;
        return await updateRegistration(id, data);
      }),

    updatePhoto: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          photoUrl: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        return await updateRegistration(input.id, { photoUrl: input.photoUrl });
      }),

    sendBulkEmail: protectedProcedure
      .input(
        z.object({
          type: z.enum(["certificate", "registration_pdf"]),
          registrationIds: z.array(z.number()),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        
        let sentCount = 0;
        let failedCount = 0;

        for (const id of input.registrationIds) {
          try {
            const regStr = "REG-" + String(id).padStart(3, "0");
            const registration = await getRegistrationById(regStr);
            if (!registration) {
              failedCount++;
              continue;
            }

            let attachmentUrl = "";
            let emailContent;

            if (input.type === "certificate") {
              const { url, key } = await generateCertificate({
                participantName: registration.fullName,
                category: registration.category as any,
                registrationId: regStr,
                registrationDate: registration.registrationDate,
                eventDate: "September 12, 2026", // Default or from settings
                venue: "Chuka Grounds",
              });
              attachmentUrl = await storageGetSignedUrl(key);
              emailContent = buildCertificateEmail(registration.fullName);
            } else {
              const { url, key } = await generateRegistrationPDF(registration);
              attachmentUrl = await storageGetSignedUrl(key);
              emailContent = buildRegistrationEmail(registration.fullName);
            }

            // Fetch the PDF to attach it
            const pdfResponse = await fetch(attachmentUrl);
            const pdfBuffer = await pdfResponse.arrayBuffer();

            const sent = await sendEmail({
              to: registration.email,
              subject: emailContent.subject,
              html: emailContent.html,
              attachments: [
                {
                  filename: input.type === "certificate" ? "Certificate.pdf" : "Registration_Form.pdf",
                  content: Buffer.from(pdfBuffer),
                }
              ]
            });

            if (sent) sentCount++;
            else failedCount++;
          } catch (e) {
            console.error(`Failed to send email to ${id}:`, e);
            failedCount++;
          }
        }
        
        return { success: true, sentCount, failedCount };
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
        page: z.number().optional().default(1),
        limit: z.number().optional().default(50)
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        return await searchAndFilterRegistrations(input.query, input.filters || {}, input.page, input.limit);
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

  // ============ Winners ============
  winner: router({
    getPublished: publicProcedure.query(async () => {
      try {
        return await getPublishedWinners();
      } catch (error) {
        console.error("Winners fetch error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch winners" });
      }
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const winner = await getWinnerById(input.id);
        if (!winner || !winner.isPublished) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Winner not found" });
        }
        return winner;
      }),

    getAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      return await getAllWinners();
    }),

    create: protectedProcedure
      .input(
        z.object({
          fullName: z.string().min(1, "Full name is required"),
          title: z.string().min(1, "Title is required"),
          category: z.enum(["adults", "teens", "little_stars", "overall"]),
          placement: z.string().optional(),
          prize: z.string().optional(),
          description: z.string().optional(),
          photoUrl: z.string().optional(),
          photoKey: z.string().optional(),
          registrationId: z.number().optional(),
          isPublished: z.boolean().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        const id = await createWinner(input);
        return { success: true, id };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          fullName: z.string().optional(),
          title: z.string().optional(),
          category: z.enum(["adults", "teens", "little_stars", "overall"]).optional(),
          placement: z.string().optional(),
          prize: z.string().optional(),
          description: z.string().optional(),
          photoUrl: z.string().optional(),
          photoKey: z.string().optional(),
          isPublished: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        const { id, ...data } = input;
        return await updateWinner(id, data);
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        return await deleteWinner(input);
      }),

    togglePublish: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        const isPublished = await toggleWinnerPublish(input);
        return { success: true, isPublished };
      }),
  }),

  // ============ Events Gallery ============
  events: router({
    getPublished: publicProcedure.query(async () => {
      try {
        return await getPublishedEvents();
      } catch (error) {
        console.error("Events fetch error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch events" });
      }
    }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const event = await getEventBySlug(input.slug);
        if (!event || !event.isPublished) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }
        const photos = await getEventPhotos(event.id);
        return { ...event, photos };
      }),

    getAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      return await getAllEvents();
    }),

    getWithPhotos: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        const event = await getEventById(input.id);
        if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        const photos = await getEventPhotos(event.id);
        return { ...event, photos };
      }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1, "Title is required"),
          slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and dashes"),
          description: z.string().optional(),
          eventDate: z.string().datetime().optional().or(z.string().optional()),
          location: z.string().optional(),
          coverImageUrl: z.string().optional(),
          coverImageKey: z.string().optional(),
          isPublished: z.boolean().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        const existing = await getEventBySlug(input.slug);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "An event with this slug already exists" });
        const id = await createEvent({
          ...input,
          eventDate: input.eventDate ? new Date(input.eventDate) : null,
        });
        return { success: true, id };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          eventDate: z.string().optional(),
          location: z.string().optional(),
          coverImageUrl: z.string().optional(),
          coverImageKey: z.string().optional(),
          isPublished: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        const { id, eventDate, ...data } = input;
        return await updateEvent(id, {
          ...data,
          ...(eventDate ? { eventDate: new Date(eventDate) } : {}),
        });
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        return await deleteEvent(input);
      }),

    togglePublish: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        const isPublished = await toggleEventPublish(input);
        return { success: true, isPublished };
      }),

    addPhotos: protectedProcedure
      .input(
        z.object({
          eventId: z.number(),
          photos: z.array(
            z.object({
              photoUrl: z.string().min(1),
              photoKey: z.string().optional(),
              caption: z.string().optional(),
            })
          ).min(1, "At least one photo is required"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        const event = await getEventById(input.eventId);
        if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        const existing = await getEventPhotos(input.eventId);
        const startOrder = existing.length;
        await createEventPhotos(
          input.photos.map((p, i) => ({ ...p, eventId: input.eventId, sortOrder: startOrder + i }))
        );
        return { success: true, added: input.photos.length };
      }),

    deletePhoto: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        return await deleteEventPhoto(input);
      }),
  }),

  // ============ Training / Bootcamp ============
  training: router({
    getActivePrograms: publicProcedure.query(async () => {
      try {
        return await getActiveTrainingPrograms();
      } catch (error) {
        console.error("Training programs fetch error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch training programs" });
      }
    }),

    register: publicProcedure
      .input(
        z.object({
          programId: z.number(),
          fullName: z.string().min(1, "Full name is required"),
          email: z.string().email("Invalid email"),
          phoneNumber: z.string().min(9, "Phone number is required"),
          category: z.enum(["adults", "teens", "little_stars"]).optional(),
          experienceLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
          emergencyContactName: z.string().optional(),
          emergencyContactPhone: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const program = await getTrainingProgramById(input.programId);
        if (!program || !program.isActive) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Training program not found or no longer active" });
        }
        if (program.capacity && program.capacity > 0) {
          const registered = await getTrainingRegistrationCount(input.programId);
          if (registered >= program.capacity) {
            throw new TRPCError({ code: "FORBIDDEN", message: "This program is fully booked" });
          }
        }
        const id = await createTrainingRegistration(input);

        // Send confirmation email asynchronously
        setImmediate(async () => {
          try {
            const confirmation = buildTrainingRegistrationEmail(program.title);
            await sendEmail({ to: input.email, ...confirmation });
          } catch (emailErr) {
            console.error("[Training] Confirmation email failed:", emailErr);
          }
        });

        return { success: true, id };
      }),

    getPrograms: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      return await getAllTrainingPrograms();
    }),

    createProgram: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1, "Title is required"),
          description: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          location: z.string().optional(),
          feeKes: z.number().int().min(0).default(0),
          capacity: z.number().int().min(0).optional(),
          imageUrl: z.string().optional(),
          imageKey: z.string().optional(),
          isActive: z.boolean().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        const id = await createTrainingProgram({
          ...input,
          startDate: input.startDate ? new Date(input.startDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
        });
        return { success: true, id };
      }),

    updateProgram: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          location: z.string().optional(),
          feeKes: z.number().int().min(0).optional(),
          capacity: z.number().int().min(0).optional(),
          imageUrl: z.string().optional(),
          imageKey: z.string().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        const { id, startDate, endDate, ...data } = input;
        return await updateTrainingProgram(id, {
          ...data,
          ...(startDate ? { startDate: new Date(startDate) } : {}),
          ...(endDate ? { endDate: new Date(endDate) } : {}),
        });
      }),

    deleteProgram: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        return await deleteTrainingProgram(input);
      }),

    toggleProgramActive: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        const isActive = await toggleTrainingProgramActive(input);
        return { success: true, isActive };
      }),

    getRegistrations: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      return await getAllTrainingRegistrations();
    }),

    updatePaymentStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(["pending", "completed"]) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        return await updateTrainingRegistrationPayment(input.id, input.status);
      }),

    deleteRegistration: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        return await deleteTrainingRegistration(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
