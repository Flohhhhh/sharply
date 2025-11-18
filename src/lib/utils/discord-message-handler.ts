import { BRANDS } from "~/lib/generated";

export const DEFAULT_STOPWORDS = new Set<string>([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "if",
  "then",
  "else",
  "when",
  "what",
  "why",
  "how",
  "which",
  "whose",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "can",
  "could",
  "should",
  "would",
  "will",
  "shall",
  "may",
  "might",
  "must",
  "at",
  "to",
  "for",
  "from",
  "of",
  "in",
  "on",
  "with",
  "about",
  "as",
  "by",
  "this",
  "that",
  "these",
  "those",
  "there",
  "here",
  "you",
  "your",
  "yours",
  "we",
  "our",
  "ours",
  "they",
  "their",
  "theirs",
  "i",
  "me",
  "my",
  "mine",
  "hey",
  "yo",
  "hi",
  "hello",
  "please",
  "pls",
  "any",
  "anyone",
  "someone",
  "out",
  "look",
  "looked",
  "looking",
  "see",
  "seen",
  "saw",
  "check",
  "checked",
  "checking",
  "think",
  "thinking",
  "know",
  "knows",
  "knew",
  "heard",
  "hear",
  "opinions",
  "opinion",
  "thoughts",
  "thought",
  "recommend",
  "recommendation",
  "recommendations",
]);

const BRAND_TOKENS: Set<string> = (() => {
  const set = new Set<string>();
  for (const b of BRANDS) {
    const name = (b.name || "").toLowerCase().trim();
    const slug = (b.slug || "").toLowerCase().trim();
    if (name) {
      set.add(name);
      name
        .split(/[^a-z]+/gi)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((part) => set.add(part.toLowerCase()));
      set.add(name.replace(/[^a-z0-9]+/gi, ""));
    }
    if (slug) {
      set.add(slug);
      set.add(slug.replace(/[^a-z0-9]+/gi, ""));
    }
  }
  return set;
})();

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function detectBrandToken(tokens: string[]): string | null {
  for (const raw of tokens) {
    const t = (raw || "").toLowerCase();
    if (!t) continue;
    if (BRAND_TOKENS.has(t)) return t;
    const compact = t.replace(/[^a-z0-9]+/gi, "");
    if (compact && BRAND_TOKENS.has(compact)) return compact;
  }
  return null;
}

const PREFERRED_TOKENS: Set<string> = new Set<string>([
  "eos",
  "ef",
  "rf",
  "fe",
  "af",
  "af-s",
  "af-p",
  "dx",
  "fx",
  "vr",
  "is",
  "oss",
  "stm",
  "usm",
  "gm",
  "g",
  "art",
  "contemporary",
  "sports",
  "macro",
  "micro",
  "dc",
  "dn",
  "dg",
  "apo",
]);

function isBrandLikeToken(lower: string): boolean {
  if (BRAND_TOKENS.has(lower)) return true;
  const compact = lower.replace(/[^a-z0-9]+/gi, "");
  return compact.length > 0 && BRAND_TOKENS.has(compact);
}

function tokenizePreservingModelPunct(input: string): string[] {
  return (input || "")
    .replace(/[^\w/.\-+]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

const ROMAN_RE = /^(?:i|ii|iii|iv|v|vi|vii|viii|ix|x)$/i;
const FNUMBER_RE = /^f\/?\d+(?:\.\d+)?$/i;
const FOCAL_RANGE_RE = /^\d{2,3}-\d{2,3}$/;
const MM_UNIT_RE = /^\d+(?:\.\d+)?mm$/i;

function looksLikeGearToken(token: string): boolean {
  const t = token ?? "";
  if (!t) return false;
  const lower = t.toLowerCase();
  if (/[a-z]/i.test(lower) && /\d/.test(lower)) return true;
  if (ROMAN_RE.test(lower)) return true;
  if (FOCAL_RANGE_RE.test(lower)) return true;
  if (MM_UNIT_RE.test(lower)) return true;
  if (FNUMBER_RE.test(lower)) return true;
  if (/^\d+(?:\.\d+)?$/.test(lower) && lower.length >= 3) return true;
  return false;
}

function keepTokenForCandidate(token: string, stopwords: Set<string>): boolean {
  const lower = (token || "").toLowerCase();
  if (!lower || stopwords.has(lower)) return false;
  if (looksLikeGearToken(token)) return true;
  if (PREFERRED_TOKENS.has(lower)) return true;
  if (isBrandLikeToken(lower)) return true;
  return false;
}

function buildCandidateWindows(
  tokens: string[],
  options: {
    windowRadius: number;
    stopwords: Set<string>;
  },
): string[] {
  const { windowRadius, stopwords } = options;
  const indices = tokens
    .map((tok, idx) => (looksLikeGearToken(tok) ? idx : -1))
    .filter((idx) => idx >= 0);

  const out = new Set<string>();
  for (const i of indices) {
    const start = Math.max(0, i - windowRadius);
    const end = Math.min(tokens.length, i + windowRadius + 1);
    const windowTokens = tokens.slice(start, end);
    const cleaned = windowTokens
      .filter((t) => keepTokenForCandidate(t, stopwords))
      .filter(
        (t, idx2, arr) =>
          arr.findIndex((x) => x.toLowerCase() === t.toLowerCase()) === idx2,
      );
    if (cleaned.length) {
      out.add(cleaned.join(" "));
    }
    out.add(tokens[i]!);
  }
  return Array.from(out);
}

function scoreCandidate(
  candidate: string,
  preferredBrand?: string | null,
): number {
  const tokens = candidate.split(/\s+/).filter(Boolean);
  const lcTokens = tokens.map((t) => t.toLowerCase());

  const hasFNumber = lcTokens.some((t) => FNUMBER_RE.test(t));
  const hasMm = lcTokens.some((t) => MM_UNIT_RE.test(t));
  const hasFocalRange = lcTokens.some((t) => FOCAL_RANGE_RE.test(t));
  const hasRoman = lcTokens.some((t) => ROMAN_RE.test(t));
  const mixedAlphaNumCount = lcTokens.filter(
    (t) => /[a-z]/i.test(t) && /\d/.test(t),
  ).length;
  const hasMixedAlphaNum = mixedAlphaNumCount > 0;

  const QUALIFIERS = new Set([
    "af",
    "af-s",
    "af-p",
    "dx",
    "fx",
    "vr",
    "is",
    "oss",
    "stm",
    "usm",
    "gm",
    "g",
    "art",
    "contemporary",
    "sports",
    "macro",
    "micro",
    "dc",
    "dn",
    "dg",
    "apo",
  ]);
  const qualifierCount = lcTokens.reduce(
    (acc, t) => acc + (QUALIFIERS.has(t) ? 1 : 0),
    0,
  );

  const gearSignals = [
    hasFNumber,
    hasMm,
    hasFocalRange,
    hasRoman,
    hasMixedAlphaNum,
    qualifierCount > 0,
  ].filter(Boolean).length;

  let score = 0;

  score +=
    (hasFocalRange ? 1.5 : 0) + (hasFNumber ? 1.2 : 0) + (hasMm ? 1.0 : 0);
  score += (hasMixedAlphaNum ? 1.0 : 0) + (hasRoman ? 0.3 : 0);
  score += Math.min(qualifierCount * 0.4, 1.2);

  if (gearSignals >= 3) score += 2.0;
  else if (gearSignals === 2) score += 1.0;

  const lengthBonusCap =
    mixedAlphaNumCount >= 2 && !(hasFocalRange || hasFNumber) ? 0.3 : 1.2;
  score += Math.min(Math.max(tokens.length - 1, 0) * 0.3, lengthBonusCap);

  if (preferredBrand) {
    const brandRe = new RegExp(
      `(^|\\s)${escapeRegExp(preferredBrand)}(\\s|$)`,
      "i",
    );
    if (brandRe.test(candidate)) {
      score += 1.0;
      if (
        new RegExp(`^${escapeRegExp(preferredBrand)}\\b`, "i").test(candidate)
      ) {
        score += 0.25;
      }
    }
  }

  if (mixedAlphaNumCount >= 2 && !(hasFocalRange || hasFNumber)) {
    score -= 2.5;
  }

  if (tokens.length === 1) {
    if (hasFNumber || hasMm) score -= 2.0;
    else if (hasMixedAlphaNum) score -= 0.5;
  }

  if (candidate.length < 4) score -= 0.5;

  return score;
}

export type ExtractCandidatesOptions = {
  windowRadius?: number;
  maxCandidates?: number;
  stopwords?: Set<string>;
};

export function extractGearQueryCandidates(
  message: string,
  options?: ExtractCandidatesOptions,
): string[] {
  const windowRadius = options?.windowRadius ?? 3;
  const maxCandidates = options?.maxCandidates ?? 8;
  const stopwords = options?.stopwords ?? DEFAULT_STOPWORDS;

  const tokens = tokenizePreservingModelPunct(message);
  if (tokens.length === 0) return [];
  const detectedBrand = detectBrandToken(tokens);

  const rawCandidates = buildCandidateWindows(tokens, {
    windowRadius,
    stopwords,
  });

  const cleanedBase = rawCandidates
    .map((c) =>
      c
        .split(/\s+/)
        .filter((t) => keepTokenForCandidate(t, stopwords))
        .filter(
          (t, idx, arr) =>
            arr.findIndex((x) => x.toLowerCase() === t.toLowerCase()) === idx,
        )
        .join(" "),
    )
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  const augmented: string[] = [];
  if (detectedBrand) {
    for (const q of cleanedBase) {
      augmented.push(q);
      const brandRe = new RegExp(
        `(^|\\s)${escapeRegExp(detectedBrand)}(\\s|$)`,
        "i",
      );
      if (!brandRe.test(q)) {
        augmented.push(`${detectedBrand} ${q}`);
      }
    }
  }

  const pool = detectedBrand ? augmented : cleanedBase;
  const deduped = Array.from(new Set(pool));
  const prioritized = deduped
    .map((q) => ({ q, score: scoreCandidate(q, detectedBrand) }))
    .sort((a, b) => b.score - a.score || a.q.length - b.q.length)
    .map((x) => x.q)
    .slice(0, maxCandidates);

  return prioritized;
}

export function extractTopGearQueryCandidate(
  message: string,
  options?: ExtractCandidatesOptions,
): string | null {
  return extractGearQueryCandidates(message, options)[0] ?? null;
}
