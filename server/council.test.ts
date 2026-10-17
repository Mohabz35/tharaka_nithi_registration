import { describe, expect, it } from "vitest";
import { appRouter } from "./routers.js";
import type { TrpcContext } from "./_core/context.js";
import type { User } from "../drizzle/schema";
import { councilSeatLabel, COUNCIL_SEATS, COUNCIL_SEAT_KEYS } from "../shared/const";

function makeUser(overrides: Partial<User> & { id?: number; role?: User["role"] }): User {
  const id = overrides.id ?? 1;
  return {
    id,
    name: overrides.name ?? `Test User ${id}`,
    email: overrides.email ?? `user${id}@example.com`,
    passwordHash: "test-hash",
    role: overrides.role ?? "user",
    staffRole: overrides.staffRole ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
}

function makeCtx(role: User["role"], id = 1, staffRole: string | null = null): TrpcContext {
  return {
    user: makeUser({ id, role, staffRole }),
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

describe("council seat constants", () => {
  it("defines all nine executive seats with treasurer and president", () => {
    expect(COUNCIL_SEATS.length).toBe(9);
    expect(COUNCIL_SEAT_KEYS).toContain("treasurer");
    expect(COUNCIL_SEAT_KEYS).toContain("president");
    expect(COUNCIL_SEAT_KEYS).toContain("vice_president");
  });

  it("labels seats for the UI and maps unknown keys to themselves", () => {
    expect(councilSeatLabel("treasurer")).toBe("Treasurer");
    expect(councilSeatLabel(null)).toBe("");
    expect(councilSeatLabel(undefined)).toBe("");
    expect(councilSeatLabel("mystery_seat")).toBe("mystery_seat");
  });
});

describe("council role gates (no DB required)", () => {
  it("blocks logged-out and plain users from treasurer endpoints", async () => {
    const loggedOut = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    } as TrpcContext);
    expect((await captureError(loggedOut.council.getFinanceLedger()))?.code).toBe("UNAUTHORIZED");

    const user = appRouter.createCaller(makeCtx("user"));
    expect((await captureError(user.council.getFinanceLedger()))?.code).toBe("FORBIDDEN");
    expect(
      (await captureError(
        user.council.submitFundRequest({ type: "payout", amount: 1000, purpose: "Venue deposit" }),
      ))?.code,
    ).toBe("FORBIDDEN");
    expect(
      (await captureError(
        user.council.submitFinanceReport({ title: "Week 1", body: "Spent on posters and flyers" }),
      ))?.code,
    ).toBe("FORBIDDEN");
    expect((await captureError(user.council.listMyFundRequests()))?.code).toBe("FORBIDDEN");
    expect((await captureError(user.council.listFinanceReports()))?.code).toBe("FORBIDDEN");
  });

  it("blocks non-treasurer committee seats from the ledger and treasurer submissions", async () => {
    const president = appRouter.createCaller(makeCtx("committee", 2, "president"));
    expect((await captureError(president.council.getFinanceLedger()))?.code).toBe("FORBIDDEN");
    expect(
      (await captureError(
        president.council.submitFundRequest({ type: "advance", amount: 500, purpose: "Sound equipment" }),
      ))?.code,
    ).toBe("FORBIDDEN");
    // …but the president may read finance reports.
    const err = await captureError(president.council.listFinanceReports());
    expect(err).not.toBeNull();
    expect(err.code).not.toBe("FORBIDDEN");
  });

  it("lets the treasurer past the ledger gate (fails only on missing DB)", async () => {
    const treasurer = appRouter.createCaller(makeCtx("committee", 3, "treasurer"));
    const err = await captureError(treasurer.council.getFinanceLedger());
    expect(err).not.toBeNull();
    expect(err.code).not.toBe("FORBIDDEN");
    expect(err.code).not.toBe("UNAUTHORIZED");
  });

  it("lets an admin past the treasurer gate (admin implies treasurer powers)", async () => {
    const admin = appRouter.createCaller(makeCtx("admin", 4));
    const err = await captureError(admin.council.getFinanceLedger());
    expect(err).not.toBeNull();
    expect(err.code).not.toBe("FORBIDDEN");
  });

  it("keeps fund-request review, VP review and seat assignment admin-only", async () => {
    const treasurer = appRouter.createCaller(makeCtx("committee", 3, "treasurer"));

    expect(
      (await captureError(
        treasurer.council.listFundRequests(),
      ))?.code,
    ).toBe("FORBIDDEN");
    expect(
      (await captureError(
        treasurer.council.reviewFundRequest({ requestId: 1, action: "approve" }),
      ))?.code,
    ).toBe("FORBIDDEN");
    expect(
      (await captureError(
        treasurer.council.markFundRequestPaid({ requestId: 1 }),
      ))?.code,
    ).toBe("FORBIDDEN");
    expect((await captureError(treasurer.council.listVpApplications()))?.code).toBe("FORBIDDEN");
    expect(
      (await captureError(
        treasurer.council.reviewVpApplication({ applicationId: 1, action: "approve" }),
      ))?.code,
    ).toBe("FORBIDDEN");
    expect(
      (await captureError(
        treasurer.council.createStaffAccount({
          name: "X Y",
          email: "x@example.com",
          password: "password123",
          staffRole: "secretary",
        }),
      ))?.code,
    ).toBe("FORBIDDEN");
    expect(
      (await captureError(
        treasurer.council.setSeat({ userId: 5, staffRole: "treasurer" }),
      ))?.code,
    ).toBe("FORBIDDEN");
  });

  it("keeps VP applications open to the public", async () => {
    const anon = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    } as TrpcContext);
    const err = await captureError(
      anon.council.applyForVicePresident({
        fullName: "Jane Doe",
        email: "jane@example.com",
        phoneNumber: "0712345678",
        statement: "I have five years of event leadership and want to serve the council.",
      }),
    );
    expect(err).not.toBeNull();
    expect(err.code).not.toBe("FORBIDDEN");
    expect(err.code).not.toBe("UNAUTHORIZED");
  });

  it("rejects an unknown council seat when assigning", async () => {
    const admin = appRouter.createCaller(makeCtx("admin", 4));
    const err = await captureError(
      admin.council.setSeat({ userId: 5, staffRole: "not_a_seat" }),
    );
    expect(err?.code).toBe("BAD_REQUEST");
  });
});
