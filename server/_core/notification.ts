import { TRPCError } from "@trpc/server";
import { sendEmail } from "./emailService.js";
import { SUPPORT_EMAIL } from "../../shared/const.js";

export type NotificationPayload = {
  title: string;
  content: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Notification title is required." });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Notification content is required." });
  }

  const title = trimValue(input.title);
  const content = trimValue(input.content);

  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Title must be at most ${TITLE_MAX_LENGTH} characters.` });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Content must be at most ${CONTENT_MAX_LENGTH} characters.` });
  }

  return { title, content };
};

/**
 * Sends an owner notification via email (falls back to console logging if
 * SMTP is not configured or the send fails).
 */
export async function notifyOwner(payload: NotificationPayload): Promise<boolean> {
  const { title, content } = validatePayload(payload);
  console.log(`[Notification] ${title}: ${content}`);
  try {
    await sendEmail({
      to: SUPPORT_EMAIL,
      subject: title,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;"><h2>${title}</h2><p>${content.replace(/\n/g, "<br/>")}</p></div>`,
    });
  } catch (error) {
    console.error("[Notification] Email delivery failed:", error);
  }
  return true;
}
