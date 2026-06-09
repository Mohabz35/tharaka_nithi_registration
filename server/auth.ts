import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import { z } from "zod";
import * as db from "./db.js";
import { ENV } from "./_core/env.js";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const.js";
import { ForbiddenError } from "../shared/_core/errors.js";

export const authRouter = Router();

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64, { N: 1024, r: 8, p: 1 }).toString("hex");
  return `${salt}:${derivedKey}`;
}

function verifyPassword(password: string, hash: string): boolean {
  const [salt, key] = hash.split(":");
  if (!salt || !key) return false;
  const derivedKey = crypto.scryptSync(password, salt, 64, { N: 1024, r: 8, p: 1 }).toString("hex");
  return key === derivedKey;
}

function getSessionSecret() {
  const secret = ENV.cookieSecret || "fallback_dev_secret_change_in_prod";
  return new TextEncoder().encode(secret);
}

async function createSessionToken(email: string, name: string): Promise<string> {
  const issuedAt = Date.now();
  const expirationSeconds = Math.floor((issuedAt + ONE_YEAR_MS) / 1000);
  
  return new SignJWT({ email, name })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(getSessionSecret());
}

export async function authenticateRequest(req: Request) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) throw ForbiddenError("Missing session cookie");

  const cookies = new Map(Object.entries(parseCookieHeader(cookieHeader)));
  const sessionCookie = cookies.get(COOKIE_NAME);
  
  if (!sessionCookie) throw ForbiddenError("Missing session cookie");

  try {
    const { payload } = await jwtVerify(sessionCookie, getSessionSecret(), {
      algorithms: ["HS256"],
    });
    
    const email = payload.email as string;
    if (!email) throw ForbiddenError("Invalid session payload");

    const user = await db.getUserByEmail(email);
    if (!user) throw ForbiddenError("User not found");

    return user;
  } catch (err) {
    throw ForbiddenError("Invalid session token");
  }
}

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().optional(),
});

authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = authSchema.parse(req.body);
    
    const existing = await db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const passwordHash = hashPassword(password);
    await db.createUser({
      email,
      passwordHash,
      name: name || email.split("@")[0],
    });

    const token = await createSessionToken(email, name || email.split("@")[0]);
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: ENV.isProduction,
      sameSite: "lax",
      maxAge: ONE_YEAR_MS,
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Registration failed" });
  }
});

authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = authSchema.parse(req.body);
    
    const user = await db.getUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = await createSessionToken(email, user.name || "");
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: ENV.isProduction,
      sameSite: "lax",
      maxAge: ONE_YEAR_MS,
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Login failed" });
  }
});

authRouter.post("/logout", (req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ success: true });
});

authRouter.get("/me", async (req: Request, res: Response) => {
  try {
    const user = await authenticateRequest(req);
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    res.status(401).json({ error: "Not authenticated" });
  }
});

export async function initializeAdmin() {
  const adminEmail = ENV.adminEmail;
  if (!adminEmail) return;

  // Use env var if set, otherwise fall back to the hardcoded default
  const adminPassword = process.env.ADMIN_PASSWORD || "Mohab@35*";

  try {
    const existing = await db.getUserByEmail(adminEmail);
    if (!existing) {
      console.log(`[Auth] Seeding admin account for ${adminEmail}`);
      await db.createUser({
        email: adminEmail,
        passwordHash: hashPassword(adminPassword),
        name: "Admin",
        role: "admin",
      });
    } else {
      // Always sync the password hash in case it was changed in env or code
      const { getDb } = await import("./db.js");
      const drizzleDb = await getDb();
      if (drizzleDb) {
        const { users } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        await drizzleDb
          .update(users)
          .set({ passwordHash: hashPassword(adminPassword), role: "admin" })
          .where(eq(users.email, adminEmail));
        console.log(`[Auth] Admin password synced for ${adminEmail}`);
      }
    }
  } catch (error) {
    console.error("[Auth] Failed to seed admin account:", error);
  }
}
