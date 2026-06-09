import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const registrations = mysqlTable("registrations", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  dateOfBirth: varchar("dateOfBirth", { length: 10 }).notNull(),
  age: int("age").notNull(),
  category: mysqlEnum("category", ["adults", "teens", "little_stars"]).notNull(),
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
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "completed"]).default("pending").notNull(),
  registrationDate: timestamp("registrationDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = typeof registrations.$inferInsert;