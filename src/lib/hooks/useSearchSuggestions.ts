"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "@hooks/useDebounce";
import type { Suggestion } from "~/types/search";

type UseSearchSuggestionsOptions = {
  minLength?: number;
  limit?: number;
  enabled?: boolean;
  debounceMs?: number;
  endpoint?: string; // GET endpoint that returns { suggestions: Suggestion[] }
};

type UseSearchSuggestionsReturn = {
  results: Suggestion[];
  loading: boolean;
  debouncing: boolean;
  hasSearched: boolean;
  fetchNow: () => Promise<void>;
  error: unknown | null;
};

export function useSearchSuggestions(
  query: string,
  options: UseSearchSuggestionsOptions = {},
): UseSearchSuggestionsReturn {
  const {
    minLength = 2,
    limit = 8,
    enabled = true,
    debounceMs = 200,
    endpoint = "/api/search/suggest",
  } = options;

  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncing, setDebouncing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRawQueryRef = useRef<string>("");
  const debouncingGuardTimeoutRef = useRef<number | null>(null);

  const debounced = useDebounce(query, debounceMs);

  // Track typing state for debouncing indicator
  useEffect(() => {
    if (!enabled) {
      setDebouncing(false);
      return;
    }

    if (query && query.length >= minLength) {
      // If raw query changed and meets length threshold, show debouncing
      if (query !== lastRawQueryRef.current) {
        setDebouncing(true);
        // Safety: clear debouncing if fetch doesn't start (e.g., background tab throttling)
        if (debouncingGuardTimeoutRef.current) {
          window.clearTimeout(debouncingGuardTimeoutRef.current);
        }
        debouncingGuardTimeoutRef.current = window.setTimeout(() => {
          setDebouncing(false);
        }, debounceMs + 800);
      }
    } else {
      setDebouncing(false);
      setHasSearched(false);
      setResults([]);
      setError(null);
      if (debouncingGuardTimeoutRef.current) {
        window.clearTimeout(debouncingGuardTimeoutRef.current);
        debouncingGuardTimeoutRef.current = null;
      }
    }

    lastRawQueryRef.current = query;
  }, [query, enabled, minLength]);

  const cancelOngoing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const doFetch = useCallback(
    async (q: string, immediate = false) => {
      if (!enabled) return;
      if (!q || q.length < minLength) return;

      cancelOngoing();
      abortControllerRef.current = new AbortController();

      setError(null);
      // Clear debouncing state when we actually start fetching, regardless of trigger type
      setDebouncing(false);
      setLoading(true);

      try {
        const url = `${endpoint}?q=${encodeURIComponent(q)}${limit ? `&limit=${limit}` : ""}`;
        const res = await fetch(url, {
          signal: abortControllerRef.current.signal,
        });
        const data = res.ok
          ? ((await res.json()) as { suggestions?: Suggestion[] })
          : { suggestions: [] };
        setResults(Array.isArray(data.suggestions) ? data.suggestions : []);
        setHasSearched(true);
      } catch (err) {
        setResults([]);
        setHasSearched(true);
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [enabled, endpoint, limit, minLength],
  );

  // Debounced fetching while typing
  useEffect(() => {
    if (!enabled) return;
    if (!debounced || debounced.length < minLength) {
      return;
    }
    void doFetch(debounced, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, enabled, minLength]);

  // Immediate fetch when crossing threshold upward (reduces perceived lag)
  const prevLenRef = useRef<number>(0);
  useEffect(() => {
    if (!enabled) return;
    const prevLen = prevLenRef.current;
    const currLen = query.length;
    // Detect transition from below threshold to >= threshold
    if (prevLen < minLength && currLen >= minLength) {
      void doFetch(query, true);
    }
    prevLenRef.current = currLen;
  }, [query, enabled, minLength, doFetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cancelOngoing();
  }, []);

  const fetchNow = useCallback(async () => {
    await doFetch(query, true);
  }, [doFetch, query]);

  return { results, loading, debouncing, hasSearched, fetchNow, error };
}
