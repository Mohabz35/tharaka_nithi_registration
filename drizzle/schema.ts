import { boolean, serial, pgEnum, pgTable, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const categoryEnum = pgEnum("category", ["adults", "teens", "little_stars"]);
export const paymentStatusEnum = pgEnum("paymentStatus", ["pending", "completed"]);

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