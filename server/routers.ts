import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRegistration, getAllRegistrations, getRegistrationsByCategory, getRegistrationStats, searchRegistrations, filterRegistrations, searchAndFilterRegistrations } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { generateImage } from "./_core/imageGeneration";
import { generateRegistrationPDF, generateParentalConsentPDF } from "./_core/pdfGenerator";

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
        await createRegistration(input);
        
        // Generate PDFs asynchronously (don't block the response)
        setImmediate(async () => {
          try {
            const mockRegistration = {
              id: 0,
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
        
        return { success: true };
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
