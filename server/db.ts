import { eq, or, desc, asc, ilike, and, gte, lte, isNotNull, count, sum, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertRegistration, InsertUser, registrations, users, partner_logos, InsertPartnerLogo,
  event_sponsors, InsertEventSponsor,
  artist_registrations, InsertArtistRegistration,
  showcase_registrations, InsertShowcaseRegistration,
  site_settings, InsertSiteSetting,
  merchandise_items, InsertMerchandiseItem,
  merchandise_orders, InsertMerchandiseOrder,
  order_items, InsertOrderItem,
  payment_plans, InsertPaymentPlan,
  installment_payments, InsertInstallmentPayment,
  payment_transactions, InsertPaymentTransaction,
  winners, InsertWinner,
  events, InsertEventRecord,
  event_photos, InsertEventPhoto,
  training_programs, InsertTrainingProgram,
  training_registrations, InsertTrainingRegistration,
  booking_enquiries, InsertBookingEnquiry,
  fund_requests, InsertFundRequest,
  finance_reports, InsertFinanceReport,
  vp_applications, InsertVpApplication,
} from "../drizzle/schema.js";
import { ENV } from "./_core/env.js";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

let _schemaEnsured = false;
let _ensurePromise: Promise<void> | null = null;

// Idempotently ensure additive schema changes exist on the live database.
// This lets deployments self-heal when a migration has not been run manually,
// without ever touching or removing existing data (uses ADD COLUMN IF NOT EXISTS).
export async function ensureSchema(): Promise<void> {
  if (_schemaEnsured || !_client) return;
  if (_ensurePromise) return _ensurePromise;
  _ensurePromise = (async () => {
    try {
      await _client!`ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "documentUrl" text`;
      await _client!`ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "documentKey" text`;
      await _client!`ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "bio" text`;
      await _client!`ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "showreelUrl" text`;
      await _client!`ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "measurements" text`;
      await _client!`ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "availableForBookings" boolean DEFAULT false NOT NULL`;

      // Create enum types if not exist
      await _client!`DO $$ BEGIN
        CREATE TYPE "planStatus" AS ENUM('active', 'completed', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$`;
      await _client!`DO $$ BEGIN
        CREATE TYPE "installmentStatus" AS ENUM('pending', 'paid', 'overdue', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$`;
      await _client!`DO $$ BEGIN
        CREATE TYPE "orderStatus" AS ENUM('pending', 'paid', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$`;

      // Committee/staff role for organizing-team dashboard access.
      // Plain statement (not inside DO/function) so it works on all PG versions.
      try {
        await _client!`ALTER TYPE "role" ADD VALUE IF NOT EXISTS 'committee'`;
      } catch (e) {
        console.warn("[Database] Could not ensure 'committee' role value:", e);
      }

      // Create merchandise_items table
      await _client!`CREATE TABLE IF NOT EXISTS "merchandise_items" (
        "id" serial PRIMARY KEY,
        "name" varchar(255) NOT NULL,
        "description" text,
        "price" integer NOT NULL,
        "category" varchar(100) NOT NULL,
        "imageUrl" text,
        "imageKey" text,
        "isActive" boolean DEFAULT true NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      )`;

      // Create merchandise_orders table
      await _client!`CREATE TABLE IF NOT EXISTS "merchandise_orders" (
        "id" serial PRIMARY KEY,
        "userId" integer,
        "registrationId" integer,
        "fullName" varchar(255) NOT NULL,
        "email" varchar(320) NOT NULL,
        "phoneNumber" varchar(20) NOT NULL,
        "totalAmount" integer NOT NULL,
        "status" "orderStatus" DEFAULT 'pending' NOT NULL,
        "paymentMethod" varchar(50),
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      )`;

      // Create order_items table
      await _client!`CREATE TABLE IF NOT EXISTS "order_items" (
        "id" serial PRIMARY KEY,
        "orderId" integer NOT NULL,
        "merchandiseId" integer NOT NULL,
        "quantity" integer DEFAULT 1 NOT NULL,
        "unitPrice" integer NOT NULL,
        "totalPrice" integer NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL
      )`;

      // Create payment_plans table
      await _client!`CREATE TABLE IF NOT EXISTS "payment_plans" (
        "id" serial PRIMARY KEY,
        "orderId" integer NOT NULL,
        "userId" integer,
        "totalAmount" integer NOT NULL,
        "numberOfInstallments" integer NOT NULL,
        "installmentAmount" integer NOT NULL,
        "status" "planStatus" DEFAULT 'active' NOT NULL,
        "startDate" timestamp DEFAULT now() NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      )`;

      // Create installment_payments table
      await _client!`CREATE TABLE IF NOT EXISTS "installment_payments" (
        "id" serial PRIMARY KEY,
        "paymentPlanId" integer NOT NULL,
        "installmentNumber" integer NOT NULL,
        "amountDue" integer NOT NULL,
        "amountPaid" integer DEFAULT 0 NOT NULL,
        "dueDate" timestamp NOT NULL,
        "paymentDate" timestamp,
        "paymentMethod" varchar(50),
        "transactionId" varchar(255),
        "status" "installmentStatus" DEFAULT 'pending' NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      )`;

      // Create payment_transactions table
      await _client!`CREATE TABLE IF NOT EXISTS "payment_transactions" (
        "id" serial PRIMARY KEY,
        "orderId" integer,
        "installmentId" integer,
        "transactionId" varchar(255) NOT NULL,
        "amount" integer NOT NULL,
        "paymentMethod" varchar(50) NOT NULL,
        "status" varchar(50) NOT NULL,
        "metadata" text,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      )`;

      // Create winners table
      await _client!`CREATE TABLE IF NOT EXISTS "winners" (
        "id" serial PRIMARY KEY,
        "fullName" varchar(255) NOT NULL,
        "title" varchar(255) NOT NULL,
        "category" varchar(50) NOT NULL,
        "placement" varchar(100),
        "prize" text,
        "description" text,
        "photoUrl" text,
        "photoKey" text,
        "registrationId" integer,
        "isPublished" boolean DEFAULT true NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      )`;

      // Create events table
      await _client!`CREATE TABLE IF NOT EXISTS "events" (
        "id" serial PRIMARY KEY,
        "slug" varchar(255) NOT NULL UNIQUE,
        "title" varchar(255) NOT NULL,
        "description" text,
        "eventDate" timestamp,
        "location" varchar(255),
        "coverImageUrl" text,
        "coverImageKey" text,
        "isPublished" boolean DEFAULT true NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      )`;

      // Create event_photos table
      await _client!`CREATE TABLE IF NOT EXISTS "event_photos" (
        "id" serial PRIMARY KEY,
        "eventId" integer NOT NULL,
        "photoUrl" text NOT NULL,
        "photoKey" text,
        "caption" varchar(255),
        "sortOrder" integer DEFAULT 0 NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL
      )`;

      // Create training_programs table
      await _client!`CREATE TABLE IF NOT EXISTS "training_programs" (
        "id" serial PRIMARY KEY,
        "title" varchar(255) NOT NULL,
        "description" text,
        "startDate" timestamp,
        "endDate" timestamp,
        "location" varchar(255),
        "feeKes" integer DEFAULT 0 NOT NULL,
        "capacity" integer,
        "imageUrl" text,
        "imageKey" text,
        "isActive" boolean DEFAULT true NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      )`;

      // Create training_registrations table
      await _client!`CREATE TABLE IF NOT EXISTS "training_registrations" (
        "id" serial PRIMARY KEY,
        "programId" integer NOT NULL,
        "fullName" varchar(255) NOT NULL,
        "email" varchar(320) NOT NULL,
        "phoneNumber" varchar(20) NOT NULL,
        "category" varchar(50),
        "experienceLevel" varchar(100),
        "emergencyContactName" varchar(255),
        "emergencyContactPhone" varchar(20),
        "notes" text,
        "paymentStatus" "paymentStatus" DEFAULT 'pending' NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL
      )`;

      // Create booking_enquiries table
      await _client!`CREATE TABLE IF NOT EXISTS "booking_enquiries" (
        "id" serial PRIMARY KEY,
        "registrationId" integer NOT NULL,
        "modelName" varchar(255) NOT NULL,
        "clientName" varchar(255) NOT NULL,
        "clientEmail" varchar(320) NOT NULL,
        "clientPhone" varchar(20),
        "eventType" varchar(255),
        "eventDate" varchar(40),
        "budget" varchar(100),
        "message" text NOT NULL,
        "status" varchar(20) DEFAULT 'new' NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL
      )`;

      // Executive council: seat key on users + council finance / VP application tables.
      await _client!`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "staffRole" text`;

      await _client!`CREATE TABLE IF NOT EXISTS "fund_requests" (
        "id" serial PRIMARY KEY,
        "requesterId" integer NOT NULL,
        "type" varchar(20) NOT NULL,
        "amount" integer NOT NULL,
        "purpose" text NOT NULL,
        "eventDate" varchar(40),
        "status" varchar(20) DEFAULT 'pending' NOT NULL,
        "adminNote" text,
        "reviewedById" integer,
        "reviewedAt" timestamp,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      )`;

      await _client!`CREATE TABLE IF NOT EXISTS "finance_reports" (
        "id" serial PRIMARY KEY,
        "submitterId" integer NOT NULL,
        "title" varchar(255) NOT NULL,
        "body" text NOT NULL,
        "amount" integer,
        "category" varchar(100) DEFAULT 'general' NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL
      )`;

      await _client!`CREATE TABLE IF NOT EXISTS "vp_applications" (
        "id" serial PRIMARY KEY,
        "fullName" varchar(255) NOT NULL,
        "email" varchar(320) NOT NULL,
        "phoneNumber" varchar(20) NOT NULL,
        "statement" text NOT NULL,
        "status" varchar(20) DEFAULT 'pending' NOT NULL,
        "adminNote" text,
        "reviewedById" integer,
        "reviewedAt" timestamp,
        "createdAt" timestamp DEFAULT now() NOT NULL
      )`;

      _schemaEnsured = true;
      console.log("[Database] Schema ensured (all tables present).");
    } catch (error) {
      console.error("[Database] ensureSchema failed:", error);
    } finally {
      _ensurePromise = null;
    }
  })();
  return _ensurePromise;
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = postgres(process.env.DATABASE_URL, { 
        max: 10, 
        prepare: false, 
        ssl: 'require',
        connect_timeout: 30,
        idle_timeout: 20,
      });
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  if (_db && !_schemaEnsured) {
    await ensureSchema();
  }
  return _db;
}

// ============ Users ============

export async function createUser(user: InsertUser): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create user: database not available");
    return;
  }

  try {
    if (user.email === ENV.adminEmail) {
      user.role = 'admin';
    }
    
    await db.insert(users).values(user);
  } catch (error) {
    console.error("[Database] Failed to create user:", error);
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ Registrations ============

export async function createRegistration(data: InsertRegistration) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const result = await db.insert(registrations).values(data).returning({ id: registrations.id });
  return result[0].id;
}

export async function getAllRegistrations() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  return await db.select().from(registrations).orderBy(desc(registrations.createdAt));
}

export async function deleteRegistration(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db.delete(registrations).where(eq(registrations.id, id));
  return true;
}

export async function updateRegistration(id: number, data: Partial<InsertRegistration>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db.update(registrations).set({ ...data, updatedAt: new Date() }).where(eq(registrations.id, id));
  return true;
}

export async function getRegistrationById(registrationIdStr: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  // Parse REG-001 or similar to int ID
  const idMatch = registrationIdStr.match(/\d+/);
  if (!idMatch) return null;
  const id = parseInt(idMatch[0], 10);
  
  const result = await db.select().from(registrations).where(eq(registrations.id, id));
  return result[0] || null;
}

export async function getRegistrationsByCategory(category: "adults" | "teens" | "little_stars") {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  return await db.select().from(registrations).where(eq(registrations.category as any, category));
}



export async function getRegistrationStats() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const all = await db.select().from(registrations);
  return {
    total: all.length,
    adults: all.filter(r => r.category === "adults").length,
    teens: all.filter(r => r.category === "teens").length,
    littleStars: all.filter(r => r.category === "little_stars").length,
  };
}

export async function searchRegistrations(query: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const searchPattern = `%${query}%`;
  return await db.select().from(registrations).where(
    or(
      ilike(registrations.fullName, searchPattern),
      ilike(registrations.email, searchPattern),
      ilike(registrations.phoneNumber, searchPattern),
      ilike(registrations.countySubLocation, searchPattern)
    )
  ).orderBy(desc(registrations.createdAt));
}

export async function filterRegistrations(filters: {
  category?: "adults" | "teens" | "little_stars";
  paymentStatus?: "pending" | "completed";
  ageMin?: number;
  ageMax?: number;
  county?: string;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  const conditions = [];
  if (filters.category) conditions.push(eq(registrations.category as any, filters.category));
  if (filters.paymentStatus) conditions.push(eq(registrations.paymentStatus, filters.paymentStatus));
  if (filters.ageMin) conditions.push(gte(registrations.age, filters.ageMin));
  if (filters.ageMax) conditions.push(lte(registrations.age, filters.ageMax));
  if (filters.county) conditions.push(ilike(registrations.countySubLocation, `%${filters.county}%`));

  return await db.select().from(registrations).where(and(...conditions)).orderBy(desc(registrations.createdAt));
}

export async function searchAndFilterRegistrations(query: string, filters: {
  category?: "adults" | "teens" | "little_stars";
  paymentStatus?: "pending" | "completed";
  ageMin?: number;
  ageMax?: number;
  county?: string;
  hasPhoto?: boolean;
}, page: number = 1, limit: number = 50) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const conditions = [];
  
  if (query) {
    const searchPattern = `%${query}%`;
    conditions.push(or(
      ilike(registrations.fullName, searchPattern),
      ilike(registrations.email, searchPattern),
      ilike(registrations.phoneNumber, searchPattern),
      ilike(registrations.countySubLocation, searchPattern)
    ));
  }

  if (filters.category) conditions.push(eq(registrations.category as any, filters.category));
  if (filters.paymentStatus) conditions.push(eq(registrations.paymentStatus, filters.paymentStatus));
  if (filters.ageMin) conditions.push(gte(registrations.age, filters.ageMin));
  if (filters.ageMax) conditions.push(lte(registrations.age, filters.ageMax));
  if (filters.county) conditions.push(ilike(registrations.countySubLocation, `%${filters.county}%`));
  if (filters.hasPhoto) conditions.push(isNotNull(registrations.photoUrl));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const totalCountResult = await db
    .select({ count: count() })
    .from(registrations)
    .where(whereClause);
  
  const totalCount = totalCountResult[0].count;

  const data = await db
    .select()
    .from(registrations)
    .where(whereClause)
    .orderBy(desc(registrations.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return { data, totalCount };
}

// ============ Partner Logos ============

export async function getPartnerLogos() {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return await db.select().from(partner_logos);
}

export async function createPartnerLogo(data: InsertPartnerLogo) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db.insert(partner_logos).values(data);
}

export async function togglePartnerLogoStatus(id: number, isActive: boolean) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db.update(partner_logos).set({ isActive, updatedAt: new Date() }).where(eq(partner_logos.id, id));
}

export async function deletePartnerLogo(id: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db.delete(partner_logos).where(eq(partner_logos.id, id));
}

// ============ Event Sponsors ============

export async function createEventSponsor(data: InsertEventSponsor) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const result = await db.insert(event_sponsors).values(data).returning({ id: event_sponsors.id });
  return result[0].id;
}

export async function getAllEventSponsors() {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return await db.select().from(event_sponsors);
}

export async function deleteEventSponsor(id: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db.delete(event_sponsors).where(eq(event_sponsors.id, id));
}

// ============ Artist Registrations ============

export async function createArtistRegistration(data: InsertArtistRegistration) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const result = await db.insert(artist_registrations).values(data).returning({ id: artist_registrations.id });
  return result[0].id;
}

export async function getAllArtistRegistrations() {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return await db.select().from(artist_registrations);
}

export async function deleteArtistRegistration(id: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db.delete(artist_registrations).where(eq(artist_registrations.id, id));
}

// ============ Showcase Registrations ============

export async function createShowcaseRegistration(data: InsertShowcaseRegistration) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const result = await db.insert(showcase_registrations).values(data).returning({ id: showcase_registrations.id });
  return result[0].id;
}

export async function getAllShowcaseRegistrations() {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return await db.select().from(showcase_registrations);
}

export async function deleteShowcaseRegistration(id: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db.delete(showcase_registrations).where(eq(showcase_registrations.id, id));
}

// ============ Site Settings ============

export async function getSiteSettings() {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return await db.select().from(site_settings);
}

export async function getSiteSetting(key: string) {
  const db = await getDb();
  if (!db) { return null; }
  const result = await db.select().from(site_settings).where(eq(site_settings.key, key)).limit(1);
  return result.length > 0 ? result[0].value : null;
}

export async function upsertSiteSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const existing = await db.select().from(site_settings).where(eq(site_settings.key, key)).limit(1);
  if (existing.length > 0) {
    await db.update(site_settings).set({ value, updatedAt: new Date() }).where(eq(site_settings.key, key));
  } else {
    await db.insert(site_settings).values({ key, value });
  }
}

// ============ Merchandise Items ============

export async function getAllMerchandiseItems() {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return await db.select().from(merchandise_items).where(eq(merchandise_items.isActive, true));
}

export async function getMerchandiseItemById(id: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const result = await db.select().from(merchandise_items).where(eq(merchandise_items.id, id));
  return result[0] || null;
}

export async function createMerchandiseItem(data: InsertMerchandiseItem) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const result = await db.insert(merchandise_items).values(data).returning({ id: merchandise_items.id });
  return result[0].id;
}

export async function updateMerchandiseItem(id: number, data: Partial<InsertMerchandiseItem>) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db.update(merchandise_items).set({ ...data, updatedAt: new Date() }).where(eq(merchandise_items.id, id));
  return true;
}

// ============ Merchandise Orders ============

export async function createMerchandiseOrder(data: InsertMerchandiseOrder) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const result = await db.insert(merchandise_orders).values(data).returning({ id: merchandise_orders.id });
  return result[0].id;
}

export async function getMerchandiseOrderById(id: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const result = await db.select().from(merchandise_orders).where(eq(merchandise_orders.id, id));
  return result[0] || null;
}

export async function getOrdersByUserId(userId: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return await db.select().from(merchandise_orders).where(eq(merchandise_orders.userId, userId)).orderBy(desc(merchandise_orders.createdAt));
}

export async function getOrdersByEmail(email: string) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return await db.select().from(merchandise_orders).where(eq(merchandise_orders.email, email)).orderBy(desc(merchandise_orders.createdAt));
}

export async function getOrdersByRegistrationId(registrationId: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return await db.select().from(merchandise_orders).where(eq(merchandise_orders.registrationId, registrationId)).orderBy(desc(merchandise_orders.createdAt));
}

export async function updateOrderStatus(id: number, status: "pending" | "paid" | "cancelled", paymentMethod?: string) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const updateData: any = { status, updatedAt: new Date() };
  if (paymentMethod) updateData.paymentMethod = paymentMethod;
  await db.update(merchandise_orders).set(updateData).where(eq(merchandise_orders.id, id));
  return true;
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return await db.select().from(merchandise_orders).orderBy(desc(merchandise_orders.createdAt));
}

// ============ Order Items ============

export async function createOrderItems(items: InsertOrderItem[]) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db.insert(order_items).values(items);
}

export async function getOrderItemsByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return await db.select().from(order_items).where(eq(order_items.orderId, orderId));
}

// ============ Payment Plans ============

export async function createPaymentPlan(data: InsertPaymentPlan) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const result = await db.insert(payment_plans).values(data).returning({ id: payment_plans.id });
  return result[0].id;
}

export async function getPaymentPlanById(id: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const result = await db.select().from(payment_plans).where(eq(payment_plans.id, id));
  return result[0] || null;
}

export async function getPaymentPlanByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const result = await db.select().from(payment_plans).where(eq(payment_plans.orderId, orderId));
  return result[0] || null;
}

export async function getPaymentPlansByUserId(userId: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return await db.select().from(payment_plans).where(eq(payment_plans.userId, userId)).orderBy(desc(payment_plans.createdAt));
}

export async function updatePaymentPlanStatus(id: number, status: "active" | "completed" | "cancelled") {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db.update(payment_plans).set({ status, updatedAt: new Date() }).where(eq(payment_plans.id, id));
  return true;
}

export async function getAllPaymentPlans() {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return await db.select().from(payment_plans).orderBy(desc(payment_plans.createdAt));
}

// ============ Installment Payments ============

export async function createInstallmentPayments(installments: InsertInstallmentPayment[]) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db.insert(installment_payments).values(installments);
}

export async function getInstallmentsByPaymentPlanId(paymentPlanId: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return await db.select().from(installment_payments).where(eq(installment_payments.paymentPlanId, paymentPlanId));
}

export async function getInstallmentById(id: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const result = await db.select().from(installment_payments).where(eq(installment_payments.id, id));
  return result[0] || null;
}

export async function updateInstallmentPayment(id: number, data: Partial<InsertInstallmentPayment>) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db.update(installment_payments).set({ ...data, updatedAt: new Date() }).where(eq(installment_payments.id, id));
  return true;
}

export async function getUpcomingInstallments(userId: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const plans = await db.select().from(payment_plans).where(eq(payment_plans.userId, userId));
  const planIds = plans.map(p => p.id);
  if (planIds.length === 0) return [];
  
  return await db.select().from(installment_payments)
    .where(and(
      eq(installment_payments.status, "pending"),
      // Use inArray equivalent
    ));
}

export async function getAllOverdueInstallments() {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const now = new Date();
  return await db.select().from(installment_payments).where(and(
    eq(installment_payments.status, "pending"),
    lte(installment_payments.dueDate, now)
  ));
}

// ============ Payment Transactions ============

export async function createPaymentTransaction(data: InsertPaymentTransaction) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const result = await db.insert(payment_transactions).values(data).returning({ id: payment_transactions.id });
  return result[0].id;
}

export async function getTransactionByTransactionId(transactionId: string) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const result = await db.select().from(payment_transactions).where(eq(payment_transactions.transactionId, transactionId));
  return result[0] || null;
}

export async function getTransactionsByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return await db.select().from(payment_transactions).where(eq(payment_transactions.orderId, orderId));
}

export async function getAllTransactions() {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return await db.select().from(payment_transactions).orderBy(desc(payment_transactions.createdAt));
}

// ============ Winners ============

export async function createWinner(data: InsertWinner) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const result = await db.insert(winners).values(data).returning({ id: winners.id });
  return result[0].id;
}

export async function getAllWinners() {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return await db.select().from(winners).orderBy(desc(winners.createdAt));
}

export async function getPublishedWinners() {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return await db.select().from(winners)
    .where(eq(winners.isPublished, true))
    .orderBy(desc(winners.createdAt));
}

export async function getWinnerById(id: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const result = await db.select().from(winners).where(eq(winners.id, id));
  return result[0] || null;
}

export async function updateWinner(id: number, data: Partial<InsertWinner>) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db.update(winners).set({ ...data, updatedAt: new Date() }).where(eq(winners.id, id));
  return true;
}

export async function deleteWinner(id: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db.delete(winners).where(eq(winners.id, id));
  return true;
}

export async function toggleWinnerPublish(id: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const current = await getWinnerById(id);
  if (!current) throw new Error("Winner not found");
  const next = !current.isPublished;
  await db.update(winners).set({ isPublished: next, updatedAt: new Date() }).where(eq(winners.id, id));
  return next;
}

// ============ Events & Event Photos ============

export async function createEvent(data: InsertEventRecord) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const result = await db.insert(events).values(data).returning({ id: events.id });
  return result[0].id;
}

export async function getAllEvents() {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const allEvents = await db.select().from(events).orderBy(desc(events.eventDate));
  const photoCounts = await db.select({
    eventId: event_photos.eventId,
    count: count(),
  }).from(event_photos).groupBy(event_photos.eventId);
  const countMap = new Map(photoCounts.map(p => [p.eventId, p.count]));
  return allEvents.map(e => ({ ...e, photoCount: countMap.get(e.id) || 0 }));
}

export async function getPublishedEvents() {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const published = await db.select().from(events)
    .where(eq(events.isPublished, true))
    .orderBy(desc(events.eventDate));
  const photoCounts = await db.select({
    eventId: event_photos.eventId,
    count: count(),
  }).from(event_photos).groupBy(event_photos.eventId);
  const countMap = new Map(photoCounts.map(p => [p.eventId, p.count]));
  return published.map(e => ({ ...e, photoCount: countMap.get(e.id) || 0 }));
}

export async function getEventBySlug(slug: string) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const result = await db.select().from(events).where(eq(events.slug, slug));
  return result[0] || null;
}

export async function getEventById(id: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const result = await db.select().from(events).where(eq(events.id, id));
  return result[0] || null;
}

export async function updateEvent(id: number, data: Partial<InsertEventRecord>) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db.update(events).set({ ...data, updatedAt: new Date() }).where(eq(events.id, id));
  return true;
}

export async function deleteEvent(id: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db.delete(event_photos).where(eq(event_photos.eventId, id));
  await db.delete(events).where(eq(events.id, id));
  return true;
}

export async function toggleEventPublish(id: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const current = await getEventById(id);
  if (!current) throw new Error("Event not found");
  const next = !current.isPublished;
  await db.update(events).set({ isPublished: next, updatedAt: new Date() }).where(eq(events.id, id));
  return next;
}

export async function getEventPhotos(eventId: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return await db.select().from(event_photos)
    .where(eq(event_photos.eventId, eventId))
    .orderBy(asc(event_photos.sortOrder), asc(event_photos.id));
}

export async function createEventPhotos(photos: InsertEventPhoto[]) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  if (photos.length === 0) return;
  await db.insert(event_photos).values(photos);
}

export async function deleteEventPhoto(id: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db.delete(event_photos).where(eq(event_photos.id, id));
  return true;
}

// ============ Training Programs & Registrations ============

export async function createTrainingProgram(data: InsertTrainingProgram) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const result = await db.insert(training_programs).values(data).returning({ id: training_programs.id });
  return result[0].id;
}

export async function getAllTrainingPrograms() {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return await db.select().from(training_programs).orderBy(desc(training_programs.createdAt));
}

export async function getActiveTrainingPrograms() {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const rows = await db.select({
    program: training_programs,
    registeredCount: count(),
  }).from(training_programs)
    .leftJoin(training_registrations, eq(training_registrations.programId, training_programs.id))
    .where(eq(training_programs.isActive, true))
    .groupBy(training_programs.id)
    .orderBy(desc(training_programs.startDate));
  return rows.map(r => ({ ...r.program, registeredCount: r.registeredCount }));
}

export async function getTrainingProgramById(id: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const result = await db.select().from(training_programs).where(eq(training_programs.id, id));
  return result[0] || null;
}

export async function updateTrainingProgram(id: number, data: Partial<InsertTrainingProgram>) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db.update(training_programs).set({ ...data, updatedAt: new Date() }).where(eq(training_programs.id, id));
  return true;
}

export async function deleteTrainingProgram(id: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db.delete(training_registrations).where(eq(training_registrations.programId, id));
  await db.delete(training_programs).where(eq(training_programs.id, id));
  return true;
}

export async function toggleTrainingProgramActive(id: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const current = await getTrainingProgramById(id);
  if (!current) throw new Error("Training program not found");
  const next = !current.isActive;
  await db.update(training_programs).set({ isActive: next, updatedAt: new Date() }).where(eq(training_programs.id, id));
  return next;
}

export async function createTrainingRegistration(data: InsertTrainingRegistration) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const result = await db.insert(training_registrations).values(data).returning({ id: training_registrations.id });
  return result[0].id;
}

export async function getTrainingRegistrationCount(programId: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const result = await db.select({ count: count() }).from(training_registrations)
    .where(eq(training_registrations.programId, programId));
  return result[0].count;
}

export async function getAllTrainingRegistrations() {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return await db.select({
    registration: training_registrations,
    programTitle: training_programs.title,
  }).from(training_registrations)
    .innerJoin(training_programs, eq(training_registrations.programId, training_programs.id))
    .orderBy(desc(training_registrations.createdAt));
}

export async function updateTrainingRegistrationPayment(id: number, status: "pending" | "completed") {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db.update(training_registrations).set({ paymentStatus: status }).where(eq(training_registrations.id, id));
  return true;
}

export async function deleteTrainingRegistration(id: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db.delete(training_registrations).where(eq(training_registrations.id, id));
  return true;
}

// ============ Model portfolio ============
export async function getPublicModelForPortfolio(id: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const rows = await db
    .select({
      id: registrations.id,
      fullName: registrations.fullName,
      age: registrations.age,
      category: registrations.category,
      countySubLocation: registrations.countySubLocation,
      photoUrl: registrations.photoUrl,
      posterUrl: registrations.posterUrl,
      portfolioUrl: registrations.portfolioUrl,
      talents: registrations.talents,
      socialMediaHandles: registrations.socialMediaHandles,
      bio: registrations.bio,
      showreelUrl: registrations.showreelUrl,
      measurements: registrations.measurements,
      availableForBookings: registrations.availableForBookings,
      registrationDate: registrations.registrationDate,
    })
    .from(registrations)
    .where(eq(registrations.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getPublishedModelPortfolioSummaries() {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return db
    .select({
      id: registrations.id,
      fullName: registrations.fullName,
      photoUrl: registrations.photoUrl,
      category: registrations.category,
    })
    .from(registrations)
    .where(isNotNull(registrations.photoUrl))
    .orderBy(desc(registrations.registrationDate));
}

// ============ Booking enquiries ============
export async function createBookingEnquiry(data: InsertBookingEnquiry) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const inserted = await db.insert(booking_enquiries).values(data).returning({ id: booking_enquiries.id });
  return inserted[0]?.id;
}

export async function getAllBookingEnquiries() {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return db.select().from(booking_enquiries).orderBy(desc(booking_enquiries.createdAt));
}

export async function updateBookingEnquiryStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db.update(booking_enquiries).set({ status }).where(eq(booking_enquiries.id, id));
  return true;
}

export async function deleteBookingEnquiry(id: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db.delete(booking_enquiries).where(eq(booking_enquiries.id, id));
  return true;
}

// ============ Team access (committee role) ============

export async function listUsers() {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      staffRole: users.staffRole,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .orderBy(asc(users.id));
}

export async function setUserRole(id: number, role: "user" | "admin" | "committee") {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id));
  return true;
}

export async function setUserStaffRole(id: number, staffRole: string | null) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db.update(users).set({ staffRole, updatedAt: new Date() }).where(eq(users.id, id));
  return true;
}

export async function countAdminsExcept(userId: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const rows = await db
    .select({ value: count() })
    .from(users)
    .where(and(eq(users.role, "admin"), ne(users.id, userId)));
  return rows[0]?.value ?? 0;
}

// ============ Financial reports ============

export type FinancialSummary = Awaited<ReturnType<typeof getFinancialSummary>>;

export async function getFinancialSummary() {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }

  const now = new Date();
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [collected] = await db
    .select({ total: sum(payment_transactions.amount) })
    .from(payment_transactions)
    .where(eq(payment_transactions.status, "success"));

  const [week] = await db
    .select({ total: sum(payment_transactions.amount) })
    .from(payment_transactions)
    .where(and(eq(payment_transactions.status, "success"), gte(payment_transactions.createdAt, since7d)));

  const [month] = await db
    .select({ total: sum(payment_transactions.amount) })
    .from(payment_transactions)
    .where(and(eq(payment_transactions.status, "success"), gte(payment_transactions.createdAt, since30d)));

  const txCounts = await db
    .select({ status: payment_transactions.status, value: count() })
    .from(payment_transactions)
    .groupBy(payment_transactions.status);

  const orderStats = await db
    .select({
      status: merchandise_orders.status,
      value: count(),
      total: sum(merchandise_orders.totalAmount),
    })
    .from(merchandise_orders)
    .groupBy(merchandise_orders.status);

  const [installments] = await db
    .select({
      totalDue: sum(installment_payments.amountDue),
      totalPaid: sum(installment_payments.amountPaid),
      overdue: count(),
    })
    .from(installment_payments)
    .where(eq(installment_payments.status, "overdue"));

  const [openInstallments] = await db
    .select({ totalDue: sum(installment_payments.amountDue), totalPaid: sum(installment_payments.amountPaid) })
    .from(installment_payments)
    .where(ne(installment_payments.status, "cancelled"));

  const recentTransactions = await db
    .select({
      id: payment_transactions.id,
      transactionId: payment_transactions.transactionId,
      amount: payment_transactions.amount,
      paymentMethod: payment_transactions.paymentMethod,
      status: payment_transactions.status,
      createdAt: payment_transactions.createdAt,
      orderName: merchandise_orders.fullName,
      orderEmail: merchandise_orders.email,
    })
    .from(payment_transactions)
    .leftJoin(merchandise_orders, eq(payment_transactions.orderId, merchandise_orders.id))
    .orderBy(desc(payment_transactions.createdAt))
    .limit(50);

  const toNum = (v: string | null) => (v === null ? 0 : Number(v));
  const statusMap = Object.fromEntries(txCounts.map(r => [r.status, r.value]));

  return {
    totalCollected: toNum(collected?.total ?? null),
    collectedLast7Days: toNum(week?.total ?? null),
    collectedLast30Days: toNum(month?.total ?? null),
    successfulTxCount: statusMap.success ?? 0,
    failedTxCount: statusMap.failed ?? 0,
    pendingTxCount: statusMap.pending ?? 0,
    orders: orderStats.map(r => ({ status: r.status, count: r.value, total: toNum(r.total) })),
    installments: {
      totalDue: toNum(openInstallments?.totalDue ?? null),
      totalPaid: toNum(openInstallments?.totalPaid ?? null),
      outstanding: toNum(openInstallments?.totalDue ?? null) - toNum(openInstallments?.totalPaid ?? null),
      overdueCount: installments?.overdue ?? 0,
    },
    recentTransactions,
  };
}

// ============ Weekly digest stats ============

export async function getWeeklyDigestStats(since: Date) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }

  const [newRegs] = await db
    .select({ value: count() })
    .from(registrations)
    .where(gte(registrations.createdAt, since));

  const byCategory = await db
    .select({ category: registrations.category, value: count() })
    .from(registrations)
    .where(gte(registrations.createdAt, since))
    .groupBy(registrations.category);

  const [newBookings] = await db
    .select({ value: count() })
    .from(booking_enquiries)
    .where(gte(booking_enquiries.createdAt, since));

  const [newPayments] = await db
    .select({ total: sum(payment_transactions.amount), value: count() })
    .from(payment_transactions)
    .where(and(eq(payment_transactions.status, "success"), gte(payment_transactions.createdAt, since)));

  const [overall] = await db.select({ value: count() }).from(registrations);

  return {
    newRegistrations: newRegs?.value ?? 0,
    registrationsByCategory: byCategory.map(r => ({ category: r.category, count: r.value })),
    totalRegistrations: overall?.value ?? 0,
    newBookingEnquiries: newBookings?.value ?? 0,
    newPaymentsAmount: newPayments?.total === null || newPayments?.total === undefined ? 0 : Number(newPayments.total),
    newPaymentsCount: newPayments?.value ?? 0,
  };
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) { return undefined; }
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ Executive council (accounts, funds, reports, VP applications) ============

export type StaffAccountInput = {
  name: string;
  email: string;
  passwordHash: string;
  staffRole: string;
};

export async function createStaffAccount(input: StaffAccountInput): Promise<number> {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const result = await db
    .insert(users)
    .values({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      role: "committee",
      staffRole: input.staffRole,
    })
    .returning({ id: users.id });
  return result[0].id;
}

export type FundRequestInput = {
  requesterId: number;
  type: "advance" | "payout";
  amount: number;
  purpose: string;
  eventDate?: string;
};

export async function createFundRequest(input: FundRequestInput): Promise<number> {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const result = await db
    .insert(fund_requests)
    .values({
      requesterId: input.requesterId,
      type: input.type,
      amount: input.amount,
      purpose: input.purpose,
      eventDate: input.eventDate,
      status: "pending",
    })
    .returning({ id: fund_requests.id });
  return result[0].id;
}

export async function listFundRequests() {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return await db
    .select({
      id: fund_requests.id,
      type: fund_requests.type,
      amount: fund_requests.amount,
      purpose: fund_requests.purpose,
      eventDate: fund_requests.eventDate,
      status: fund_requests.status,
      adminNote: fund_requests.adminNote,
      reviewedAt: fund_requests.reviewedAt,
      createdAt: fund_requests.createdAt,
      requesterId: fund_requests.requesterId,
      requesterName: users.name,
      requesterEmail: users.email,
    })
    .from(fund_requests)
    .leftJoin(users, eq(fund_requests.requesterId, users.id))
    .orderBy(desc(fund_requests.createdAt));
}

export async function listFundRequestsByUser(requesterId: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return await db
    .select()
    .from(fund_requests)
    .where(eq(fund_requests.requesterId, requesterId))
    .orderBy(desc(fund_requests.createdAt));
}

export async function reviewFundRequest(
  id: number,
  status: "approved" | "rejected",
  adminNote: string | null,
  reviewedById: number,
) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db
    .update(fund_requests)
    .set({ status, adminNote, reviewedById, reviewedAt: new Date(), updatedAt: new Date() })
    .where(eq(fund_requests.id, id));
  return true;
}

export async function markFundRequestPaid(id: number, reviewedById: number) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db
    .update(fund_requests)
    .set({ status: "paid", reviewedById, reviewedAt: new Date(), updatedAt: new Date() })
    .where(eq(fund_requests.id, id));
  return true;
}

export type FinanceReportInput = {
  submitterId: number;
  title: string;
  body: string;
  amount?: number;
  category?: string;
};

export async function createFinanceReport(input: FinanceReportInput): Promise<number> {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const result = await db
    .insert(finance_reports)
    .values({
      submitterId: input.submitterId,
      title: input.title,
      body: input.body,
      amount: input.amount,
      category: input.category ?? "general",
    })
    .returning({ id: finance_reports.id });
  return result[0].id;
}

export async function listFinanceReports() {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return await db
    .select({
      id: finance_reports.id,
      title: finance_reports.title,
      body: finance_reports.body,
      amount: finance_reports.amount,
      category: finance_reports.category,
      createdAt: finance_reports.createdAt,
      submitterId: finance_reports.submitterId,
      submitterName: users.name,
      submitterEmail: users.email,
      staffRole: users.staffRole,
    })
    .from(finance_reports)
    .leftJoin(users, eq(finance_reports.submitterId, users.id))
    .orderBy(desc(finance_reports.createdAt));
}

export type VpApplicationInput = {
  fullName: string;
  email: string;
  phoneNumber: string;
  statement: string;
};

export async function createVpApplication(input: VpApplicationInput): Promise<number> {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  const result = await db
    .insert(vp_applications)
    .values({
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      phoneNumber: input.phoneNumber,
      statement: input.statement,
      status: "pending",
    })
    .returning({ id: vp_applications.id });
  return result[0].id;
}

export async function listVpApplications() {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  return await db.select().from(vp_applications).orderBy(desc(vp_applications.createdAt));
}

export async function reviewVpApplication(
  id: number,
  status: "approved" | "rejected",
  adminNote: string | null,
  reviewedById: number,
) {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }
  await db
    .update(vp_applications)
    .set({ status, adminNote, reviewedById, reviewedAt: new Date() })
    .where(eq(vp_applications.id, id));
  return true;
}

export type FinanceLedger = {
  registrationFees: number;
  paymentsCollected: number;
  fundsGenerated: number;
  disbursed: number;
  pendingOut: number;
  balance: number;
  completedRegistrationCount: number;
  successfulTxCount: number;
};

// Treasurer ledger: money generated (registration fees + successful payments)
// vs money disbursed (approved/paid fund requests) and still pending.
export async function getFinanceLedger(registrationFee: number): Promise<FinanceLedger> {
  const db = await getDb();
  if (!db) { throw new Error("Database not available"); }

  const [completedRegs] = await db
    .select({ value: count() })
    .from(registrations)
    .where(eq(registrations.paymentStatus, "completed"));

  const [payments] = await db
    .select({ total: sum(payment_transactions.amount), value: count() })
    .from(payment_transactions)
    .where(eq(payment_transactions.status, "success"));

  const requestTotals = await db
    .select({ status: fund_requests.status, total: sum(fund_requests.amount) })
    .from(fund_requests)
    .groupBy(fund_requests.status);

  const toNum = (v: string | null) => (v === null ? 0 : Number(v));
  const statusMap = Object.fromEntries(requestTotals.map(r => [r.status, toNum(r.total)]));

  const registrationFees = (completedRegs?.value ?? 0) * registrationFee;
  const paymentsCollected = toNum(payments?.total ?? null);
  const fundsGenerated = registrationFees + paymentsCollected;
  const disbursed = statusMap.paid ?? 0;
  const pendingOut = (statusMap.pending ?? 0) + (statusMap.approved ?? 0);

  return {
    registrationFees,
    paymentsCollected,
    fundsGenerated,
    disbursed,
    pendingOut,
    balance: fundsGenerated - disbursed,
    completedRegistrationCount: completedRegs?.value ?? 0,
    successfulTxCount: payments?.value ?? 0,
  };
}
