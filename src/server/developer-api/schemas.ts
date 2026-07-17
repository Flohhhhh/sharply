import { z } from "zod";
import { DeveloperApiError } from "./errors";

const querySchema = z.string().trim().min(2).max(200);

function positiveInteger(value: string | null, fallback: number, max: number) {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) return null;
  return parsed;
}

export function parseSearchParams(searchParams: URLSearchParams) {
  const query = querySchema.safeParse(searchParams.get("q"));
  const page = positiveInteger(searchParams.get("page"), 1, 10_000);
  const limit = positiveInteger(searchParams.get("limit"), 20, 25);

  if (!query.success || page === null || limit === null) {
    throw new DeveloperApiError(
      "invalid_request",
      400,
      "q must be 2–200 characters and page and limit must be positive integers (limit 25 or less).",
    );
  }

  return { query: query.data, page, limit };
}

export function parseSuggestionParams(searchParams: URLSearchParams) {
  const query = querySchema.safeParse(searchParams.get("q"));
  const limit = positiveInteger(searchParams.get("limit"), 8, 10);
  const regionValue = searchParams.get("region") ?? "GLOBAL";
  const region = z.enum(["GLOBAL", "US", "EU", "JP"]).safeParse(regionValue);

  if (!query.success || limit === null || !region.success) {
    throw new DeveloperApiError(
      "invalid_request",
      400,
      "q must be 2–200 characters, limit must be a positive integer, and region must be GLOBAL, US, EU, or JP.",
    );
  }

  return { query: query.data, limit, region: region.data };
}

export function parseSpecSelectors(searchParams: URLSearchParams) {
  const value = searchParams.get("fields");
  if (!value || value.length > 2_000) {
    throw new DeveloperApiError(
      "invalid_request",
      400,
      "fields must contain one to 50 comma-separated field or category selectors.",
    );
  }

  const selectors = value
    .split(",")
    .map((selector) => selector.trim())
    .filter(Boolean);
  const validSelector = /^[a-z][a-zA-Z0-9-]*(?:\.[a-zA-Z][a-zA-Z0-9-]*)*$/;

  if (
    selectors.length === 0 ||
    selectors.length > 50 ||
    selectors.some((selector) => !validSelector.test(selector))
  ) {
    throw new DeveloperApiError(
      "invalid_request",
      400,
      "fields must contain one to 50 comma-separated field or category selectors.",
    );
  }

  return selectors;
}

export function parseKeyName(value: unknown) {
  const result = z.string().trim().min(1).max(100).safeParse(value);
  if (!result.success) {
    throw new DeveloperApiError(
      "invalid_request",
      400,
      "A key name between 1 and 100 characters is required.",
    );
  }
  return result.data;
}
