import { describe, expect, it } from "vitest";
import { appRouter } from "./routers.js";
import type { TrpcContext } from "./_core/context.js";
import type { User } from "../drizzle/schema.js";

type AuthenticatedUser = User;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  const adminUser: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user: adminUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createNonAdminContext(): TrpcContext {
  const regularUser: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user: regularUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("registration", () => {
  describe("submit", () => {
    it("should accept public registration submission", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.registration.submit({
        fullName: "John Doe",
        dateOfBirth: "2000-01-15",
        age: 24,
        category: "adults",
        phoneNumber: "+254712345678",
        email: "john@example.com",
        countySubLocation: "Chuka",
      });

      expect(result).toEqual({ success: true });
    });

    it("should reject invalid email", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.registration.submit({
          fullName: "John Doe",
          dateOfBirth: "2000-01-15",
          age: 24,
          category: "adults",
          phoneNumber: "+254712345678",
          email: "invalid-email",
          countySubLocation: "Chuka",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("Invalid email");
      }
    });

    it("should reject invalid date format", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.registration.submit({
          fullName: "John Doe",
          dateOfBirth: "01/15/2000",
          age: 24,
          category: "adults",
          phoneNumber: "+254712345678",
          email: "john@example.com",
          countySubLocation: "Chuka",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("Invalid date format");
      }
    });
  });
});

describe("admin", () => {
  describe("getRegistrationsByCategory", () => {
    it("should allow admin to fetch registrations", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // This should not throw an error
      const result = await caller.admin.getRegistrationsByCategory("adults");
      expect(Array.isArray(result)).toBe(true);
    });

    it("should deny non-admin access", async () => {
      const ctx = createNonAdminContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.admin.getRegistrationsByCategory("adults");
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
        expect(error.message).toContain("Admin access required");
      }
    });
  });

  describe("getStats", () => {
    it("should allow admin to fetch stats", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.admin.getStats();
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("adults");
      expect(result).toHaveProperty("teens");
      expect(result).toHaveProperty("littleStars");
    });

    it("should deny non-admin access to stats", async () => {
      const ctx = createNonAdminContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.admin.getStats();
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });
});
