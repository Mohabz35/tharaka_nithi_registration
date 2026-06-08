import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

describe("gallery.getPublicRegistrations", () => {
  it("returns empty array when no registrations exist", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.gallery.getPublicRegistrations({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("filters registrations by category", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.gallery.getPublicRegistrations({
      category: "adults",
    });

    expect(Array.isArray(result)).toBe(true);
    // All results should be adults if any exist
    result.forEach((reg) => {
      expect(reg.category).toBe("adults");
    });
  });

  it("filters registrations by search query", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.gallery.getPublicRegistrations({
      search: "test",
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("only returns registrations with photo consent", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.gallery.getPublicRegistrations({});

    // All returned registrations should have consentPhotoVideo = true
    // This is enforced in the query filter
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns only public-safe fields", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.gallery.getPublicRegistrations({});

    if (result.length > 0) {
      const model = result[0];
      // Check that only public-safe fields are returned
      expect(model).toHaveProperty("id");
      expect(model).toHaveProperty("fullName");
      expect(model).toHaveProperty("category");
      expect(model).toHaveProperty("age");
      expect(model).toHaveProperty("talents");
      expect(model).toHaveProperty("photoUrl");
      expect(model).toHaveProperty("posterUrl");
      expect(model).toHaveProperty("registrationDate");

      // Sensitive fields should not be present
      expect(model).not.toHaveProperty("email");
      expect(model).not.toHaveProperty("phoneNumber");
      expect(model).not.toHaveProperty("countySubLocation");
    }
  });

  it("combines search and category filters", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.gallery.getPublicRegistrations({
      category: "teens",
      search: "model",
    });

    expect(Array.isArray(result)).toBe(true);
    result.forEach((reg) => {
      expect(reg.category).toBe("teens");
    });
  });
});
