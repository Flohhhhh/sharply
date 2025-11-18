// In Next.js runtime, enforce server-only import. In scripts (Node), skip.
if (process.env.NEXT_RUNTIME) {
  import("server-only").catch(() => {
    console.warn("[discord-bot:service] server-only import failed, skipping.");
  });
}

import {
  extractGearQueryCandidates,
  type ExtractCandidatesOptions,
} from "~/lib/utils/discord-message-handler";
import {
  searchGear,
  type SearchResult,
} from "~/server/search/service";

export type ResolveFromMessageOk = {
  ok: true;
  item: SearchResult;
  tried: string[];
  usedQuery: string;
};

export type ResolveFromMessageErrorCode =
  | "EMPTY_MESSAGE"
  | "NO_CANDIDATES"
  | "NOT_FOUND";

export type ResolveFromMessageErr = {
  ok: false;
  code: ResolveFromMessageErrorCode;
  tried: string[];
};

export type ResolveFromMessageResult =
  | ResolveFromMessageOk
  | ResolveFromMessageErr;

export type ResolveFromMessageOptions = {
  /**
   * Candidate extraction tuning. Defaults are usually fine.
   */
  extract?: ExtractCandidatesOptions;
  /**
   * Maximum distinct candidate queries to try (in order).
   * Default: 6
   */
  maxQueries?: number;
};

/**
 * Resolve a free-form message to a single gear item by:
 * 1) Extracting gear-like candidate phrases
 * 2) Querying the shared search service with each candidate, in order
 * 3) Returning the first top result, or a standardized error code
 */
export async function resolveGearFromMessage(
  message: string,
  options?: ResolveFromMessageOptions,
): Promise<ResolveFromMessageResult> {
  const trimmed = (message || "").trim();
  if (!trimmed) {
    return { ok: false, code: "EMPTY_MESSAGE", tried: [] };
  }

  const candidates = extractGearQueryCandidates(trimmed, options?.extract);
  if (!candidates || candidates.length === 0) {
    return { ok: false, code: "NO_CANDIDATES", tried: [] };
  }

  const tried: string[] = [];
  const max = Math.max(1, Math.min(options?.maxQueries ?? 6, candidates.length));
  for (let i = 0; i < max; i++) {
    const q = candidates[i]!;
    tried.push(q);
    try {
      const result = await searchGear({
        query: q,
        sort: "relevance",
        page: 1,
        pageSize: 1,
      });
      const top = result.results[0];
      if (top) {
        return { ok: true, item: top, tried, usedQuery: q };
      }
    } catch {
      // Continue to next candidate on any transient error
    }
  }

  return { ok: false, code: "NOT_FOUND", tried };
}


