import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Registration } from "../drizzle/schema";

const storagePut = vi.fn(async (key: string, _buffer: Buffer) => ({
  url: `https://cdn.test/${key}`,
  key,
}));

vi.mock("./storage.js", () => ({
  storagePut: (key: string, buffer: Buffer, contentType?: string) => storagePut(key, buffer, contentType),
  storageGet: vi.fn(),
  storageGetSignedUrl: vi.fn(async (key: string) => `https://cdn.test/signed/${key}`),
}));

import { generateRegistrationPDF, generateParentalConsentPDF } from "./_core/pdfGenerator.js";
import { generateRegistrationReceiptPDF } from "./_core/receiptGenerator.js";
import {
  generateCertificate,
  generateAchievementCertificate,
} from "./_core/certificateGenerator.js";

function makeRegistration(overrides: Partial<Registration> = {}): Registration {
  const now = new Date("2026-09-01T10:00:00Z");
  return {
    id: 42,
    fullName: "Jane Wanjiku",
    dateOfBirth: "2000-04-12",
    age: 26,
    category: "adults",
    phoneNumber: "+254 700 000000",
    email: "jane@example.com",
    countySubLocation: "Chuka East, Tharaka-Nithi",
    photoUrl: null,
    photoKey: null,
    portfolioUrl: null,
    portfolioKey: null,
    talents: null,
    socialMediaHandles: null,
    bio: null,
    showreelUrl: null,
    measurements: null,
    availableForBookings: false,
    posterUrl: null,
    posterKey: null,
    consentPhotoVideo: true,
    consentDataProcessing: true,
    consentTerms: true,
    parentalConsentSigned: null,
    parentalConsentUrl: null,
    documentUrl: null,
    documentKey: null,
    paymentStatus: "completed",
    registrationDate: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as Registration;
}

function expectPdf(result: { url: string; key: string }) {
  expect(result.url).toContain("https://cdn.test/");
  expect(result.key.length).toBeGreaterThan(0);
  const buffer = storagePut.mock.calls[storagePut.mock.calls.length - 1]?.[1] as Buffer;
  expect(buffer).toBeInstanceOf(Buffer);
  expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  expect(buffer.byteLength).toBeGreaterThan(2000);
}

beforeEach(() => {
  storagePut.mockClear();
});

describe("PDF generators (storage mocked)", () => {
  it("generates an official registration letter (adult, paid)", async () => {
    const result = await generateRegistrationPDF(makeRegistration());
    expectPdf(result);
  });

  it("generates a letter for a minor with the guardian column", async () => {
    const result = await generateRegistrationPDF(
      makeRegistration({
        id: 7,
        category: "teens",
        age: 16,
        fullName: "A Very Long Name That Should Still Fit On The Page Without Overflowing At All",
        paymentStatus: "pending",
      })
    );
    expectPdf(result);
  });

  it("generates a parental consent form", async () => {
    const result = await generateParentalConsentPDF(makeRegistration({ id: 9, category: "little_stars", age: 9 }));
    expectPdf(result);
  });

  it("generates a paid receipt", async () => {
    const result = await generateRegistrationReceiptPDF({
      registrationId: "REG-042",
      fullName: "Jane Wanjiku",
      registrationDate: new Date("2026-09-01T10:00:00Z"),
      feeKes: 1000,
      paymentStatus: "completed",
    });
    expectPdf(result);
  });

  it("generates a payment-due receipt", async () => {
    const result = await generateRegistrationReceiptPDF({
      registrationId: "REG-007",
      fullName: 'John "J.J." O\'Neill, Jnr',
      registrationDate: new Date("2026-09-02T08:30:00Z"),
      feeKes: 2500,
      paymentStatus: "pending",
    });
    expectPdf(result);
  });

  it("generates a no-fee receipt", async () => {
    const result = await generateRegistrationReceiptPDF({
      registrationId: "REG-001",
      fullName: "Free Entry",
      registrationDate: new Date("2026-09-03T08:30:00Z"),
      feeKes: 0,
      paymentStatus: "pending",
    });
    expectPdf(result);
  });

  it("generates a registration certificate", async () => {
    const result = await generateCertificate({
      participantName: "Jane Wanjiku",
      category: "adults",
      registrationId: "REG-042",
      registrationDate: new Date("2026-09-01T10:00:00Z"),
      eventDate: "September 12, 2026",
      venue: "Chuka Grounds",
    });
    expectPdf(result);
  });

  it("generates a winner achievement certificate", async () => {
    const result = await generateAchievementCertificate({
      recipientName: "Amina Kilonzo-Mwangi",
      award: "Miss Face of Tharaka-Nithi 2026 — Winner",
      kind: "winner",
      categoryLabel: "Adults (18–35)",
      fileNameId: "winner_3",
    });
    expectPdf(result);
  });

  it("generates a participation certificate", async () => {
    const result = await generateAchievementCertificate({
      recipientName: "Young Contestant",
      award: "Certificate of Participation",
      kind: "participation",
      categoryLabel: "Little Stars (5–12)",
      fileNameId: "REG-009",
    });
    expectPdf(result);
  });
});
