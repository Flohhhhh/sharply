export const DEVELOPER_API_KEY_PREFIX = "sharply_live_";
export const DEVELOPER_API_KEY_DISPLAY_LENGTH = 20;
export const DEVELOPER_API_MAX_ACTIVE_KEYS = 3;
export const DEVELOPER_API_RATE_LIMIT = 60;
export const DEVELOPER_API_RATE_LIMIT_WINDOW_MS = 60_000;

export const DEVELOPER_API_ENDPOINTS = [
  "search",
  "suggestions",
  "gear",
] as const;

export type DeveloperApiEndpoint = (typeof DEVELOPER_API_ENDPOINTS)[number];
