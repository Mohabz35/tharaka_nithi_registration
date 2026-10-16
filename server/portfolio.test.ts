import { describe, expect, it } from "vitest";
import { appRouter } from "./routers.js";
import type { TrpcContext } from "./_core/context.js";
import type { User } from "../drizzle/schema.js";
import { slugifyText, modelSlug, parseModelSlug } from "../shared/const.js";

function createContext(user: User | null): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

const regularUser = {
  id: 2,
  email: "user@example.com",
  name: "Regular User",
  passwordHash: "hash",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
} as unknown as User;

const adminUser = {
  id: 1,
  email: "admin@example.com",
  name: "Admin User",
  passwordHash: "hash",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
} as unknown as User;

describe("model slug helpers", () => {
  it("slugifies names to url-safe form", () => {
    expect(slugifyText("Breeda Karani")).toBe("breeda-karani");
    expect(slugifyText("  Macrine Awuor!  ")).toBe("macrine-awuor");
    expect(slugifyText("")).toBe("");
  });

  it("appends the registration id to the slug", () => {
    expect(modelSlug(42, "Jane Doe")).toBe("jane-doe-42");
    expect(modelSlug(7, "")).toBe("model-7");
  });

  it("parses id from any-name-123 slugs", () => {
    expect(parseModelSlug("jane-doe-42")).toEqual({ id: 42, name: "jane-doe" });
    expect(parseModelSlug("completely-different-name-42")).toEqual({ id: 42, name: "completely-different-name" });
  });

  it("parses bare numeric ids", () => {
    expect(parseModelSlug("42")).toEqual({ id: 42, name: "" });
  });

  it("rejects unparsable slugs", () => {
    expect(parseModelSlug("no-id-here")).toBeNull();
    expect(parseModelSlug("")).toBeNull();
    expect(parseModelSlug("jane-doe-abc")).toBeNull();
  });
});

describe("modelProfile.getPortfolio", () => {
  it("returns NOT_FOUND for unparsable slugs", async () => {
    const caller = appRouter.createCaller(createContext(null));
    await expect(caller.modelProfile.getPortfolio({ slug: "not-a-valid-slug" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("modelProfile.updateProfile", () => {
  it("requires a valid email for ownership proof", async () => {
    const caller = appRouter.createCaller(createContext(null));
    await expect(
      caller.modelProfile.updateProfile({ registrationId: 1, email: "not-an-email", bio: "x" })
    ).rejects.toThrow();
  });

  it("rejects invalid showreel-free payloads with bad email format", async () => {
    const caller = appRouter.createCaller(createContext(null));
    await expect(
      caller.modelProfile.updateProfile({ registrationId: 1, email: "" })
    ).rejects.toThrow();
  });
});

describe("modelProfile.bookModel", () => {
  it("validates client input before touching the database", async () => {
    const caller = appRouter.createCaller(createContext(null));
    await expect(
      caller.modelProfile.bookModel({
        registrationId: 1,
        clientName: "",
        clientEmail: "bad",
        message: "",
      })
    ).rejects.toThrow();
  });
});

describe("bookings router access control", () => {
  it("rejects unauthenticated users on admin procedures", async () => {
    const caller = appRouter.createCaller(createContext(null));
    await expect(caller.bookings.getAll()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects non-admin users on admin procedures", async () => {
    const caller = appRouter.createCaller(createContext(regularUser));
    await expect(caller.bookings.getAll()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.bookings.updateStatus({ id: 1, status: "contacted" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(caller.bookings.delete(1)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("accepts admin users on the auth layer", async () => {
    const caller = appRouter.createCaller(createContext(adminUser));
    try {
      const result = await caller.bookings.getAll();
      expect(Array.isArray(result)).toBe(true);
    } catch (error: any) {
      expect(error.code).not.toBe("UNAUTHORIZED");
      expect(error.code).not.toBe("FORBIDDEN");
    }
  });
});
