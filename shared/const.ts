export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

// ============ Event branding ============
export const EVENT_NAME = "Mr & Miss Face of Tharaka-Nithi County 2026";
export const EVENT_DATE = "September 12, 2026";
export const EVENT_VENUE = "Chuka Grounds";
export const ORGANIZER_NAME = "Royals Icon Events";
export const SUPPORT_EMAIL = "face.of.tharakanithi.county@royaliconevents.co.ke";
export const SUPPORT_WHATSAPP = "254702894309";
// ISO deadline shown by the registration countdown
export const REGISTRATION_DEADLINE_ISO = "2026-07-01T23:59:59";
export const VOTE_URL = "https://www.royaliconevents.co.ke";

// ============ Social media ============
// One handle, everywhere: "faceoftharakanithi" on every platform.
export const SOCIAL_HANDLE = "faceoftharakanithi";

export const SOCIAL_LINKS = {
  instagram: `https://www.instagram.com/${SOCIAL_HANDLE}/`,
  tiktok: `https://www.tiktok.com/@${SOCIAL_HANDLE}`,
  twitter: `https://x.com/${SOCIAL_HANDLE}`,
  facebook: `https://www.facebook.com/${SOCIAL_HANDLE}`,
  youtube: `https://www.youtube.com/@${SOCIAL_HANDLE}`,
  whatsapp: `https://wa.me/${SUPPORT_WHATSAPP}`,
} as const;

export type SocialPlatform = keyof typeof SOCIAL_LINKS;

// ============ Model portfolio slugs ============
export function slugifyText(value: string): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function modelSlug(id: number, fullName: string): string {
  const base = slugifyText(fullName) || "model";
  return `${base}-${id}`;
}

// Accepts "any-name-123" or bare "123". Returns null when unparsable.
export function parseModelSlug(slug: string): { id: number; name: string } | null {
  const match = /^([a-z0-9-]+?)-(\d+)$/.exec((slug || "").toLowerCase());
  if (!match) {
    const bareId = Number.parseInt(slug, 10);
    if (Number.isInteger(bareId) && String(bareId) === slug.trim()) {
      return { id: bareId, name: "" };
    }
    return null;
  }
  const id = Number.parseInt(match[2], 10);
  if (!Number.isInteger(id) || id < 1) return null;
  return { id, name: match[1] };
}
