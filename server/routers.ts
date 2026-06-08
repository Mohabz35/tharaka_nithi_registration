import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRegistration, getAllRegistrations, getRegistrationsByCategory, getRegistrationStats } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
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
        })
      )
      .mutation(async ({ input }) => {
        await createRegistration(input);
        return { success: true };
      }),
  }),

  admin: router({
    getRegistrationsByCategory: protectedProcedure
      .input(z.enum(["adults", "teens", "little_stars"]))
      .query(async ({ ctx, input }) => {
        // Only owner can access admin functions
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
  }),
});

export type AppRouter = typeof appRouter;
