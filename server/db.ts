import { eq, or, desc, ilike, and, gte, lte, isNotNull, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertRegistration, InsertUser, registrations, users, partner_logos, InsertPartnerLogo,
  event_sponsors, InsertEventSponsor,
  artist_registrations, InsertArtistRegistration,
  showcase_registrations, InsertShowcaseRegistration,
  site_settings, InsertSiteSetting,
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
      _schemaEnsured = true;
      console.log("[Database] Schema ensured (registration document columns present).");
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
