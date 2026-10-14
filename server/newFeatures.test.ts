import { describe, expect, it } from "vitest";
import { appRouter } from "./routers.js";
import { renderShareHtml } from "./_core/shareRoutes.js";
import type { TrpcContext } from "./_core/context.js";
import type { User } from "../drizzle/schema.js";

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

describe("share meta tag rendering", () => {
  it("includes Open Graph and Twitter meta tags", () => {
    const html = renderShareHtml({
      title: "Jane Doe - Miss Face of Tharaka-Nithi 2026",
      description: "Congratulations to our champion.",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/winner.jpg",
      canonicalUrl: "https://www.faceoftharakanithi.app/share/winner/1",
      redirectUrl: "/winners/1",
    });

    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:description"');
    expect(html).toContain('property="og:image" content="https://res.cloudinary.com/demo/image/upload/winner.jpg"');
    expect(html).toContain('property="twitter:card" content="summary_large_image"');
    expect(html).toContain('name="description"');
    expect(html).toContain("Jane Doe - Miss Face of Tharaka-Nithi 2026");
  });

  it("redirects visitors to the SPA winner page", () => {
    const html = renderShareHtml({
      title: "Champion",
      description: "Winner",
      imageUrl: "https://example.com/photo.jpg",
      canonicalUrl: "https://www.faceoftharakanithi.app/share/winner/5",
      redirectUrl: "/winners/5",
    });

    expect(html).toContain('http-equiv="refresh" content="0;url=/winners/5"');
    expect(html).toContain('window.location.replace("/winners/5")');
  });

  it("escapes HTML in user-provided fields", () => {
    const html = renderShareHtml({
      title: '<script>alert("xss")</script>',
      description: 'A "quoted" description & more',
      imageUrl: "https://example.com/photo.jpg",
      canonicalUrl: "https://www.faceoftharakanithi.app/share/winner/1",
      redirectUrl: "/winners/1",
    });

    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&quot;quoted&quot;");
    expect(html).toContain("&amp;");
  });

  it("embeds JSON-LD structured data when provided", () => {
    const html = renderShareHtml({
      title: "Champion",
      description: "Winner",
      imageUrl: "https://example.com/photo.jpg",
      canonicalUrl: "https://www.faceoftharakanithi.app/share/winner/1",
      redirectUrl: "/winners/1",
      jsonLd: { "@context": "https://schema.org", "@type": "Person", name: "Champion" },
    });

    expect(html).toContain('application/ld+json');
    expect(html).toContain('"@type":"Person"');
  });
});

describe("winner router access control", () => {
  it("rejects unauthenticated users on admin procedures", async () => {
    const caller = appRouter.createCaller(createContext(null));

    await expect(caller.winner.getAll()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects non-admin users on admin procedures", async () => {
    const caller = appRouter.createCaller(createContext(regularUser));

    await expect(caller.winner.getAll()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      caller.winner.create({
        fullName: "Jane Doe",
        title: "Miss Face",
        category: "overall",
        isPublished: true,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.winner.delete(1)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("accepts admin users on admin procedures", async () => {
    const caller = appRouter.createCaller(createContext(adminUser));
    // Admin passes the auth layer; outcome depends on database availability
    try {
      const result = await caller.winner.getAll();
      expect(Array.isArray(result)).toBe(true);
    } catch (error: any) {
      expect(error.code).not.toBe("UNAUTHORIZED");
      expect(error.code).not.toBe("FORBIDDEN");
    }
  });
});

describe("events router access control", () => {
  it("rejects unauthenticated and non-admin users", async () => {
    const publicCaller = appRouter.createCaller(createContext(null));
    const userCaller = appRouter.createCaller(createContext(regularUser));

    await expect(publicCaller.events.getAll()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(userCaller.events.getAll()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      userCaller.events.create({ title: "Finale", slug: "finale" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(userCaller.events.delete(1)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(userCaller.events.getWithPhotos({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("validates slug format", async () => {
    const adminCaller = appRouter.createCaller(createContext(adminUser));

    await expect(
      adminCaller.events.create({ title: "Finale", slug: "Not A Valid Slug!" })
    ).rejects.toThrow(/Slug must be lowercase/);
  });
});

describe("training router access control", () => {
  it("rejects unauthenticated and non-admin users", async () => {
    const publicCaller = appRouter.createCaller(createContext(null));
    const userCaller = appRouter.createCaller(createContext(regularUser));

    await expect(publicCaller.training.getPrograms()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(userCaller.training.getPrograms()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      userCaller.training.createProgram({ title: "Bootcamp", isActive: true })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(userCaller.training.getRegistrations()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(userCaller.training.deleteRegistration(1)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("validates registration input", async () => {
    const publicCaller = appRouter.createCaller(createContext(null));

    await expect(
      publicCaller.training.register({
        programId: 1,
        fullName: "",
        email: "not-an-email",
        phoneNumber: "123",
      })
    ).rejects.toThrow();
  });
});
