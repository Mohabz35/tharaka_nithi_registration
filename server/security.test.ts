import { afterEach, beforeEach, describe, expect, it } from "vitest";
import express from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";
import {
  rateLimit,
  resetRateLimits,
  securityHeaders,
  timingSafeStringEqual,
} from "./_core/security.js";
import { verifyWebhookChallenge } from "./webhooks.js";

describe("timingSafeStringEqual", () => {
  it("matches equal strings", () => {
    expect(timingSafeStringEqual("secret-123", "secret-123")).toBe(true);
  });

  it("rejects different strings of the same length", () => {
    expect(timingSafeStringEqual("secret-123", "secret-124")).toBe(false);
  });

  it("rejects different lengths without throwing", () => {
    expect(timingSafeStringEqual("short", "a-much-longer-value")).toBe(false);
    expect(timingSafeStringEqual("", "anything")).toBe(false);
  });
});

describe("verifyWebhookChallenge", () => {
  const original = process.env.INTASEND_WEBHOOK_CHALLENGE;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.INTASEND_WEBHOOK_CHALLENGE;
    } else {
      process.env.INTASEND_WEBHOOK_CHALLENGE = original;
    }
  });

  it("passes when no challenge is configured", () => {
    delete process.env.INTASEND_WEBHOOK_CHALLENGE;
    const result = verifyWebhookChallenge({ challenge: "anything" });
    expect(result).toEqual({ ok: true, configured: false });
  });

  it("accepts a matching top-level challenge", () => {
    process.env.INTASEND_WEBHOOK_CHALLENGE = "my-secret";
    expect(verifyWebhookChallenge({ challenge: "my-secret" })).toEqual({
      ok: true,
      configured: true,
    });
  });

  it("accepts a matching challenge nested under payload", () => {
    process.env.INTASEND_WEBHOOK_CHALLENGE = "my-secret";
    expect(
      verifyWebhookChallenge({ payload: { challenge: "my-secret" } }),
    ).toEqual({ ok: true, configured: true });
  });

  it("rejects a mismatched challenge", () => {
    process.env.INTASEND_WEBHOOK_CHALLENGE = "my-secret";
    expect(verifyWebhookChallenge({ challenge: "attacker-guess" })).toEqual({
      ok: false,
      configured: true,
    });
  });

  it("rejects a missing challenge when one is configured", () => {
    process.env.INTASEND_WEBHOOK_CHALLENGE = "my-secret";
    expect(verifyWebhookChallenge({})).toEqual({ ok: false, configured: true });
  });
});

describe("rateLimit + securityHeaders middleware", () => {
  let server: Server;
  let baseUrl: string;

  beforeEach(async () => {
    resetRateLimits();
    const app = express();
    app.use(securityHeaders);
    app.get(
      "/limited",
      rateLimit({ windowMs: 60_000, max: 2, message: "Slow down." }),
      (_req, res) => {
        res.json({ ok: true });
      },
    );
    await new Promise<void>(resolve => {
      server = app.listen(0, resolve);
    });
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    await new Promise<void>(resolve => {
      server.close(() => resolve());
    });
    resetRateLimits();
  });

  it("allows up to max requests, then returns 429 with Retry-After", async () => {
    expect((await fetch(`${baseUrl}/limited`)).status).toBe(200);
    expect((await fetch(`${baseUrl}/limited`)).status).toBe(200);

    const blocked = await fetch(`${baseUrl}/limited`);
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBeTruthy();
    expect(await blocked.json()).toEqual({ error: "Slow down." });
  });

  it("applies security headers to responses", async () => {
    const res = await fetch(`${baseUrl}/limited`);
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("x-frame-options")).toBe("SAMEORIGIN");
    expect(res.headers.get("referrer-policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(res.headers.get("x-powered-by")).toBeNull();
  });
});
