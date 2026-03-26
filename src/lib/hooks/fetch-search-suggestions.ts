import type { Suggestion } from "~/types/search";

type FetchSearchSuggestionsParams = {
  endpoint: string;
  query: string;
  limit: number;
  countryCode?: string | null;
  signal?: AbortSignal;
};

type FetchSearchSuggestionsResult = {
  suggestions: Suggestion[];
};

export async function fetchSearchSuggestions({
  endpoint,
  query,
  limit,
  countryCode,
  signal,
}: FetchSearchSuggestionsParams): Promise<FetchSearchSuggestionsResult> {
  const countryParam = countryCode
    ? `&country=${encodeURIComponent(countryCode)}`
    : "";
  const url = `${endpoint}?q=${encodeURIComponent(query)}${limit ? `&limit=${limit}` : ""}${countryParam}`;
  const res = await fetch(url, { signal });
  const data = res.ok ? ((await res.json()) as { suggestions?: Suggestion[] }) : {};
  return {
    suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
  };
}
