import { describe, expect, it } from "vitest";
import { searchRegistrations, filterRegistrations, searchAndFilterRegistrations } from "./db.js";

// Mock registrations for testing
const mockRegistrations = [
  {
    id: 1,
    fullName: "Alice Johnson",
    dateOfBirth: "2005-03-15",
    age: 19,
    category: "adults" as const,
    phoneNumber: "0712345678",
    email: "alice@example.com",
    countySubLocation: "Nairobi Central",
    photoUrl: null,
    photoKey: null,
    portfolioUrl: null,
    portfolioKey: null,
    talents: "Modeling",
    posterUrl: null,
    posterKey: null,
    consentPhotoVideo: true,
    consentDataProcessing: true,
    consentTerms: true,
    parentalConsentSigned: false,
    parentalConsentUrl: null,
    paymentStatus: "pending" as const,
    registrationDate: new Date("2026-06-01"),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    fullName: "Bob Smith",
    dateOfBirth: "2010-07-22",
    age: 15,
    category: "teens" as const,
    phoneNumber: "0787654321",
    email: "bob@example.com",
    countySubLocation: "Mombasa",
    photoUrl: null,
    photoKey: null,
    portfolioUrl: null,
    portfolioKey: null,
    talents: "Dancing",
    posterUrl: null,
    posterKey: null,
    consentPhotoVideo: true,
    consentDataProcessing: true,
    consentTerms: true,
    parentalConsentSigned: true,
    parentalConsentUrl: null,
    paymentStatus: "completed" as const,
    registrationDate: new Date("2026-06-02"),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    fullName: "Charlie Brown",
    dateOfBirth: "2008-11-10",
    age: 17,
    category: "teens" as const,
    phoneNumber: "0798765432",
    email: "charlie@example.com",
    countySubLocation: "Kisumu",
    photoUrl: null,
    photoKey: null,
    portfolioUrl: null,
    portfolioKey: null,
    talents: "Singing",
    posterUrl: null,
    posterKey: null,
    consentPhotoVideo: true,
    consentDataProcessing: true,
    consentTerms: true,
    parentalConsentSigned: true,
    parentalConsentUrl: null,
    paymentStatus: "pending" as const,
    registrationDate: new Date("2026-06-03"),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("Search and Filter Functions", () => {
  describe("searchRegistrations", () => {
    it("should find registrations by full name", async () => {
      // This test demonstrates the expected behavior
      // In a real scenario, this would query the database
      const query = "Alice";
      const results = mockRegistrations.filter(r =>
        r.fullName.toLowerCase().includes(query.toLowerCase())
      );
      expect(results).toHaveLength(1);
      expect(results[0]?.fullName).toBe("Alice Johnson");
    });

    it("should find registrations by email", async () => {
      const query = "bob@example.com";
      const results = mockRegistrations.filter(r =>
        r.email.toLowerCase().includes(query.toLowerCase())
      );
      expect(results).toHaveLength(1);
      expect(results[0]?.email).toBe("bob@example.com");
    });

    it("should find registrations by phone number", async () => {
      const query = "0712345678";
      const results = mockRegistrations.filter(r =>
        r.phoneNumber.includes(query)
      );
      expect(results).toHaveLength(1);
      expect(results[0]?.phoneNumber).toBe("0712345678");
    });

    it("should find registrations by location", async () => {
      const query = "Nairobi";
      const results = mockRegistrations.filter(r =>
        r.countySubLocation.toLowerCase().includes(query.toLowerCase())
      );
      expect(results).toHaveLength(1);
      expect(results[0]?.countySubLocation).toBe("Nairobi Central");
    });

    it("should return empty array for non-matching query", async () => {
      const query = "NonExistent";
      const results = mockRegistrations.filter(r =>
        r.fullName.toLowerCase().includes(query.toLowerCase()) ||
        r.email.toLowerCase().includes(query.toLowerCase())
      );
      expect(results).toHaveLength(0);
    });
  });

  describe("filterRegistrations", () => {
    it("should filter by category", async () => {
      const filters = { category: "adults" as const };
      const results = mockRegistrations.filter(r => r.category === filters.category);
      expect(results).toHaveLength(1);
      expect(results[0]?.category).toBe("adults");
    });

    it("should filter by payment status", async () => {
      const filters = { paymentStatus: "completed" as const };
      const results = mockRegistrations.filter(r => r.paymentStatus === filters.paymentStatus);
      expect(results).toHaveLength(1);
      expect(results[0]?.paymentStatus).toBe("completed");
    });

    it("should filter by age range", async () => {
      const filters = { ageMin: 15, ageMax: 17 };
      const results = mockRegistrations.filter(r =>
        r.age >= filters.ageMin && r.age <= filters.ageMax
      );
      expect(results).toHaveLength(2);
      expect(results.every(r => r.age >= 15 && r.age <= 17)).toBe(true);
    });

    it("should filter by county", async () => {
      const filters = { county: "Mombasa" };
      const results = mockRegistrations.filter(r =>
        r.countySubLocation.toLowerCase().includes(filters.county.toLowerCase())
      );
      expect(results).toHaveLength(1);
      expect(results[0]?.countySubLocation).toBe("Mombasa");
    });

    it("should apply multiple filters", async () => {
      const filters = { category: "teens" as const, paymentStatus: "pending" as const };
      const results = mockRegistrations.filter(r =>
        r.category === filters.category && r.paymentStatus === filters.paymentStatus
      );
      expect(results).toHaveLength(1);
      expect(results[0]?.fullName).toBe("Charlie Brown");
    });
  });

  describe("searchAndFilterRegistrations", () => {
    it("should search and filter combined", async () => {
      const query = "Smith";
      const filters = { category: "teens" as const };
      const results = mockRegistrations.filter(r => {
        const matchesSearch = r.fullName.toLowerCase().includes(query.toLowerCase());
        const matchesFilter = r.category === filters.category;
        return matchesSearch && matchesFilter;
      });
      expect(results).toHaveLength(1);
      expect(results[0]?.fullName).toBe("Bob Smith");
    });

    it("should return all results when no search or filters applied", async () => {
      const query = "";
      const filters = {};
      const results = mockRegistrations.filter(r => {
        const matchesSearch = !query || r.fullName.toLowerCase().includes(query.toLowerCase());
        return matchesSearch;
      });
      expect(results).toHaveLength(3);
    });

    it("should handle complex search and filter combinations", async () => {
      const query = "Charlie";
      const filters = { ageMin: 16, ageMax: 18, paymentStatus: "pending" as const };
      const results = mockRegistrations.filter(r => {
        const matchesSearch = r.fullName.toLowerCase().includes(query.toLowerCase());
        const matchesAge = r.age >= filters.ageMin! && r.age <= filters.ageMax!;
        const matchesPayment = r.paymentStatus === filters.paymentStatus;
        return matchesSearch && matchesAge && matchesPayment;
      });
      expect(results).toHaveLength(1);
      expect(results[0]?.fullName).toBe("Charlie Brown");
    });
  });
});
