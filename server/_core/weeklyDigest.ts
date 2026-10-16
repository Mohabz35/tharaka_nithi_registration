import { getSiteSetting, upsertSiteSetting, getWeeklyDigestStats } from "../db.js";
import { sendEmail, buildWeeklyDigestEmail } from "./emailService.js";
import { SUPPORT_EMAIL } from "../../shared/const.js";

export const DIGEST_SETTING_KEY = "last_weekly_digest_sent_at";
export const DIGEST_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

// Pure decision helper (unit-tested): has the weekly digest gone stale?
export function isDigestDue(lastSentIso: string | null | undefined, now: Date = new Date()): boolean {
  if (!lastSentIso) return true;
  const sentAt = Date.parse(lastSentIso);
  if (Number.isNaN(sentAt)) return true;
  return now.getTime() - sentAt >= DIGEST_INTERVAL_MS;
}

export async function sendWeeklyDigest(options?: { force?: boolean }): Promise<{ sent: boolean; reason?: string }> {
  try {
    const lastSent = await getSiteSetting(DIGEST_SETTING_KEY);
    const now = new Date();
    if (!options?.force && !isDigestDue(lastSent, now)) {
      return { sent: false, reason: "not-due" };
    }

    const since = new Date(now.getTime() - DIGEST_INTERVAL_MS);
    const stats = await getWeeklyDigestStats(since);
    const fromLabel = since.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const toLabel = now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

    const email = buildWeeklyDigestEmail(stats, fromLabel, toLabel);
    const ok = await sendEmail({ to: SUPPORT_EMAIL, ...email });
    if (!ok) return { sent: false, reason: "email-failed" };

    await upsertSiteSetting(DIGEST_SETTING_KEY, now.toISOString());
    return { sent: true };
  } catch (error) {
    console.error("[WeeklyDigest] Failed to send digest:", error);
    return { sent: false, reason: "error" };
  }
}

// Fire-and-forget variant for automatic triggers (never throws).
export async function maybeSendWeeklyDigest(): Promise<void> {
  try {
    const lastSent = await getSiteSetting(DIGEST_SETTING_KEY);
    if (!isDigestDue(lastSent)) return;
    await sendWeeklyDigest();
  } catch (error) {
    console.error("[WeeklyDigest] Auto-digest failed:", error);
  }
}
