export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

export const CATEGORIES = {
  ADULTS: "adults",
  TEENS: "teens",
  LITTLE_STARS: "little_stars",
} as const;

export const CATEGORY_LABELS = {
  [CATEGORIES.ADULTS]: "Adults (18-26)",
  [CATEGORIES.TEENS]: "Teens (13-17)",
  [CATEGORIES.LITTLE_STARS]: "Little Stars (5-12)",
} as const;
