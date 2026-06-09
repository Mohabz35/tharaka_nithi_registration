import { boolean, serial, pgEnum, pgTable, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const categoryEnum = pgEnum("category", ["adults", "teens", "little_stars"]);
export const paymentStatusEnum = pgEnum("paymentStatus", ["pending", "completed"]);
export const sponsorTypeEnum = pgEnum("sponsorType", ["sponsor", "partner"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  dateOfBirth: varchar("dateOfBirth", { length: 10 }).notNull(),
  age: integer("age").notNull(),
  category: categoryEnum("category").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  countySubLocation: varchar("countySubLocation", { length: 255 }).notNull(),
  photoUrl: text("photoUrl"),
  photoKey: text("photoKey"),
  portfolioUrl: text("portfolioUrl"),
  portfolioKey: text("portfolioKey"),
  talents: text("talents"),
  socialMediaHandles: text("socialMediaHandles"), // JSON: {instagram, tiktok, twitter, facebook}
  posterUrl: text("posterUrl"),
  posterKey: text("posterKey"),
  consentPhotoVideo: boolean("consentPhotoVideo").default(false).notNull(),
  consentDataProcessing: boolean("consentDataProcessing").default(false).notNull(),
  consentTerms: boolean("consentTerms").default(false).notNull(),
  parentalConsentSigned: boolean("parentalConsentSigned").default(false),
  parentalConsentUrl: text("parentalConsentUrl"),
  paymentStatus: paymentStatusEnum("paymentStatus").default("pending").notNull(),
  registrationDate: timestamp("registrationDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = typeof registrations.$inferInsert;

export const partner_logos = pgTable("partner_logos", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  logoUrl: text("logoUrl").notNull(),
  logoKey: text("logoKey").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PartnerLogo = typeof partner_logos.$inferSelect;
export type InsertPartnerLogo = typeof partner_logos.$inferInsert;

// --- New tables ---

export const event_sponsors = pgTable("event_sponsors", {
  id: serial("id").primaryKey(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  organizationName: varchar("organizationName", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  sponsorType: sponsorTypeEnum("sponsorType").notNull(),
  message: text("message"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EventSponsor = typeof event_sponsors.$inferSelect;
export type InsertEventSponsor = typeof event_sponsors.$inferInsert;

export const artist_registrations = pgTable("artist_registrations", {
  id: serial("id").primaryKey(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  stageName: varchar("stageName", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  artType: varchar("artType", { length: 255 }).notNull(),
  socialMediaHandles: text("socialMediaHandles"), // JSON
  message: text("message"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ArtistRegistration = typeof artist_registrations.$inferSelect;
export type InsertArtistRegistration = typeof artist_registrations.$inferInsert;

export const showcase_registrations = pgTable("showcase_registrations", {
  id: serial("id").primaryKey(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  businessName: varchar("businessName", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  showcaseType: varchar("showcaseType", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ShowcaseRegistration = typeof showcase_registrations.$inferSelect;
export type InsertShowcaseRegistration = typeof showcase_registrations.$inferInsert;

export const site_settings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SiteSetting = typeof site_settings.$inferSelect;
export type InsertSiteSetting = typeof site_settings.$inferInsert;