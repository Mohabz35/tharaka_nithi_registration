import { boolean, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const categoryEnum = pgEnum("category", ["adults", "teens", "little_stars"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed"]);
export const artistStatusEnum = pgEnum("artist_status", ["pending", "approved", "rejected"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  dateOfBirth: varchar("date_of_birth", { length: 10 }).notNull(),
  age: integer("age").notNull(),
  category: categoryEnum("category").notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  countySubLocation: varchar("county_sub_location", { length: 255 }).notNull(),
  photoUrl: text("photo_url"),
  photoKey: text("photo_key"),
  portfolioUrl: text("portfolio_url"),
  portfolioKey: text("portfolio_key"),
  talents: text("talents"),
  posterUrl: text("poster_url"),
  posterKey: text("poster_key"),
  consentPhotoVideo: boolean("consent_photo_video").default(false).notNull(),
  consentDataProcessing: boolean("consent_data_processing").default(false).notNull(),
  consentTerms: boolean("consent_terms").default(false).notNull(),
  parentalConsentSigned: boolean("parental_consent_signed").default(false),
  parentalConsentUrl: text("parental_consent_url"),
  paymentStatus: paymentStatusEnum("payment_status").default("pending").notNull(),
  registrationDate: timestamp("registration_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = typeof registrations.$inferInsert;

export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  logoUrl: text("logo_url").notNull(),
  logoKey: text("logo_key"),
  websiteUrl: text("website_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Partner = typeof partners.$inferSelect;
export type InsertPartner = typeof partners.$inferInsert;

export const artists = pgTable("artists", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  artistType: varchar("artist_type", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  portfolioUrl: text("portfolio_url"),
  description: text("description"),
  status: artistStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Artist = typeof artists.$inferSelect;
export type InsertArtist = typeof artists.$inferInsert;
