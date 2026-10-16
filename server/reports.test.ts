import { describe, expect, it } from "vitest";
import { appRouter } from "./routers.js";
import type { TrpcContext } from "./_core/context.js";
import { DIGEST_INTERVAL_MS, isDigestDue } from "./_core/weeklyDigest.js";
import {
  buildAchievementCertificateEmail,
  buildRegistrationReceiptEmail,
  buildWeeklyDigestEmail,
  type WeeklyDigestStats,
} from "./_core/emailService.js";
import { SUPPORT_EMAIL } from "../shared/const.js";

function makeCtx(role: "user" | "admin" | "committee", id = 1): TrpcContext {
  return {
    user: {
      id,
      openId: `test-user-${id}`,
      email: `user${id}@example.com`,
      name: `Test User ${id}`,
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

async function captureError(promise: Promise<unknown>): Promise<any> {
  try {
    await promise;
    return null;
  } catch (error) {
    return error;
  }
}

describe("isDigestDue", () => {
  const now = new Date("2026-10-15T12:00:00Z");

  it("is due when the digest has never been sent", () => {
    expect(isDigestDue(null, now)).toBe(true);
    expect(isDigestDue(undefined, now)).toBe(true);
  });

  it("is due when the stored timestamp is unparsable", () => {
    expect(isDigestDue("not-a-date", now)).toBe(true);
  });

  it("is not due within the 7-day interval", () => {
    const lastSent = new Date(now.getTime() - DIGEST_INTERVAL_MS + 60 * 1000).toISOString();
    expect(isDigestDue(lastSent, now)).toBe(false);
  });

  it("is due exactly at the 7-day interval", () => {
    const lastSent = new Date(now.getTime() - DIGEST_INTERVAL_MS).toISOString();
    expect(isDigestDue(lastSent, now)).toBe(true);
  });

  it("is due well past the interval", () => {
    const lastSent = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString();
    expect(isDigestDue(lastSent, now)).toBe(true);
  });

  it("is not due for a send from the future (clock skew guard)", () => {
    const lastSent = new Date(now.getTime() + 60 * 1000).toISOString();
    expect(isDigestDue(lastSent, now)).toBe(false);
  });
});

describe("buildRegistrationReceiptEmail", () => {
  it("renders a paid receipt with the registration number and fee", () => {
    const email = buildRegistrationReceiptEmail("Jane Wanjiku", "REG-042", 1000, "completed");

    expect(email.subject).toContain("REG-042");
    expect(email.html).toContain("Jane Wanjiku");
    expect(email.html).toContain("REG-042");
    expect(email.html).toContain("KES 1,000");
    expect(email.html).toContain("PAID");
    expect(email.html).not.toContain("PAYMENT DUE");
    expect(email.html).toContain(SUPPORT_EMAIL);
  });

  it("renders a payment-due receipt for pending fees", () => {
    const email = buildRegistrationReceiptEmail("John Doe", "REG-007", 2500, "pending");

    expect(email.html).toContain("PAYMENT DUE");
    expect(email.html).not.toContain("PAID");
    expect(email.html).toContain("KES 2,500");
    expect(email.html).toContain(SUPPORT_EMAIL);
  });
});

describe("buildAchievementCertificateEmail", () => {
  it("mentions the recipient, award and support contact", () => {
    const email = buildAchievementCertificateEmail("Amina Kilonzo", "Miss Face of Tharaka-Nithi 2026");

    expect(email.subject).toContain("Amina Kilonzo");
    expect(email.subject).toContain("Miss Face of Tharaka-Nithi 2026");
    expect(email.html).toContain("Amina Kilonzo");
    expect(email.html).toContain("Miss Face of Tharaka-Nithi 2026");
    expect(email.html).toContain(SUPPORT_EMAIL);
  });
});

describe("buildWeeklyDigestEmail", () => {
  const stats: WeeklyDigestStats = {
    newRegistrations: 5,
    registrationsByCategory: [
      { category: "adults", count: 3 },
      { category: "teens", count: 2 },
    ],
    totalRegistrations: 42,
    newBookingEnquiries: 1,
    newPaymentsAmount: 12500,
    newPaymentsCount: 4,
  };

  it("summarises the period with counts and category labels", () => {
    const email = buildWeeklyDigestEmail(stats, "8 Oct", "15 Oct 2026");

    expect(email.subject).toContain("8 Oct");
    expect(email.subject).toContain("15 Oct 2026");
    expect(email.html).toContain("Weekly Digest");
    expect(email.html).toContain("New registrations");
    expect(email.html).toContain("42");
    expect(email.html).toContain("Adults");
    expect(email.html).toContain("Teens");
    expect(email.html).toContain("KES 12,500");
    expect(email.html).toContain(SUPPORT_EMAIL);
  });

  it("falls back gracefully when there are no new registrations", () => {
    const email = buildWeeklyDigestEmail(
      {
        newRegistrations: 0,
        registrationsByCategory: [],
        totalRegistrations: 42,
        newBookingEnquiries: 0,
        newPaymentsAmount: 0,
        newPaymentsCount: 0,
      },
      "8 Oct",
      "15 Oct 2026",
    );

    expect(email.html).toContain("No new registrations this period");
    expect(email.html).toContain("KES 0");
  });
});

describe("role-based access (no DB required)", () => {
  it("blocks plain users from staff endpoints", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    const err = await captureError(caller.admin.getRegistrationsByCategory("adults"));
    expect(err?.code).toBe("FORBIDDEN");
  });

  it("allows committee into staff endpoints (past the gate)", async () => {
    const caller = appRouter.createCaller(makeCtx("committee"));
    const err = await captureError(caller.admin.getRegistrationsByCategory("adults"));
    expect(err).not.toBeNull();
    expect(err.code).not.toBe("FORBIDDEN");
  });

  it("blocks committee from financial reports, team management and settings", async () => {
    const caller = appRouter.createCaller(makeCtx("committee"));

    expect((await captureError(caller.admin.getFinancialReport()))?.code).toBe("FORBIDDEN");
    expect((await captureError(caller.admin.listUsers()))?.code).toBe("FORBIDDEN");
    expect((await captureError(caller.admin.digestStatus()))?.code).toBe("FORBIDDEN");
    expect((await captureError(caller.admin.sendWeeklyDigest()))?.code).toBe("FORBIDDEN");
    expect(
      (await captureError(caller.admin.setUserRole({ userId: 1, role: "committee" })))?.code,
    ).toBe("FORBIDDEN");
    expect((await captureError(caller.admin.updateSiteSetting({ key: "x", value: "y" })))?.code).toBe(
      "FORBIDDEN",
    );
    expect((await captureError(caller.admin.deleteRegistration(1)))?.code).toBe("FORBIDDEN");
    expect((await captureError(caller.admin.emailWinnerCertificate({ winnerId: 1 })))?.code).toBe(
      "FORBIDDEN",
    );
  });

  it("blocks plain users from booking enquiries", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    const err = await captureError(caller.bookings.getAll());
    expect(err?.code).toBe("FORBIDDEN");
  });

  it("prevents an admin from demoting themselves", async () => {
    const caller = appRouter.createCaller(makeCtx("admin", 7));
    const err = await captureError(caller.admin.setUserRole({ userId: 7, role: "committee" }));
    expect(err?.code).toBe("FORBIDDEN");
    expect(err?.message).toContain("cannot remove your own admin role");
  });
});
