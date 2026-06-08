import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertRegistration, InsertUser, registrations, users, partners, InsertPartner, artists, InsertArtist } from "../drizzle/schema";
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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createRegistration(data: InsertRegistration) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const [result] = await db.insert(registrations).values(data);
  return result.insertId;
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

export async function getAllPartners() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(partners).where(eq(partners.isActive, true));
}

export async function upsertPartner(data: InsertPartner) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (data.id) {
    await db.update(partners).set(data).where(eq(partners.id, data.id));
  } else {
    await db.insert(partners).values(data);
  }
}

export async function createArtist(data: InsertArtist) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(artists).values(data);
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
