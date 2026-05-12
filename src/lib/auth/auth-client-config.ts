export function resolveAuthClientBaseURL() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return process.env.NEXT_PUBLIC_BASE_URL;
}
