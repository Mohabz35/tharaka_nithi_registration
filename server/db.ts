import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertRegistration, InsertUser, registrations, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

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

export async function createRegistration(data: InsertRegistration) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db.insert(registrations).values(data);
}

export async function getRegistrationsByCategory(category: "adults" | "teens" | "little_stars") {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  return await db.select().from(registrations).where(eq(registrations.category as any, category));
}

export async function getAllRegistrations() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  return await db.select().from(registrations);
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
  const all = await db.select().from(registrations);
  const lowerQuery = query.toLowerCase();
  return all.filter(r =>
    r.fullName.toLowerCase().includes(lowerQuery) ||
    r.email.toLowerCase().includes(lowerQuery) ||
    r.phoneNumber.includes(query) ||
    r.countySubLocation.toLowerCase().includes(lowerQuery)
  );
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
  const all = await db.select().from(registrations);
  return all.filter(r => {
    if (filters.category && r.category !== filters.category) return false;
    if (filters.paymentStatus && r.paymentStatus !== filters.paymentStatus) return false;
    if (filters.ageMin && r.age < filters.ageMin) return false;
    if (filters.ageMax && r.age > filters.ageMax) return false;
    if (filters.county && !r.countySubLocation.toLowerCase().includes(filters.county.toLowerCase())) return false;
    return true;
  });
}

export async function searchAndFilterRegistrations(query: string, filters: {
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
  const all = await db.select().from(registrations);
  const lowerQuery = query.toLowerCase();
  return all.filter(r => {
    // Search filter
    const matchesSearch = !query || (
      r.fullName.toLowerCase().includes(lowerQuery) ||
      r.email.toLowerCase().includes(lowerQuery) ||
      r.phoneNumber.includes(query) ||
      r.countySubLocation.toLowerCase().includes(lowerQuery)
    );
    if (!matchesSearch) return false;

    // Category filter
    if (filters.category && r.category !== filters.category) return false;
    // Payment status filter
    if (filters.paymentStatus && r.paymentStatus !== filters.paymentStatus) return false;
    // Age range filter
    if (filters.ageMin && r.age < filters.ageMin) return false;
    if (filters.ageMax && r.age > filters.ageMax) return false;
    // County filter
    if (filters.county && !r.countySubLocation.toLowerCase().includes(filters.county.toLowerCase())) return false;
    return true;
  });
}
