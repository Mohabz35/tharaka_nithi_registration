import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

// Constant-time string comparison (length-safe: timingSafeEqual throws on
// different lengths, which would itself leak length via a 500).
export function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

interface Bucket {
  count: number;
  resetAt: number;
}

// In-memory sliding window, keyed by client IP + mounted path. On serverless
// this is per-instance (not global), but it still throttles bursts and
// credential stuffing against any single function instance.
const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 20000;

export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = "Too many requests. Please try again later.",
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();

    if (buckets.size > MAX_TRACKED_KEYS) {
      buckets.forEach((bucket, key) => {
        if (bucket.resetAt <= now) buckets.delete(key);
      });
      if (buckets.size > MAX_TRACKED_KEYS) buckets.clear();
    }

    const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
    const key = `${ip}|${req.baseUrl}`;
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({ error: message });
    }
    return next();
  };
}

// Test helper: clears all rate-limit state between tests.
export function resetRateLimits() {
  buckets.clear();
}

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.removeHeader("X-Powered-By");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  next();
}
