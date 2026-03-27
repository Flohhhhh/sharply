"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "@hooks/useDebounce";
import { fetchSearchSuggestions } from "./fetch-search-suggestions";
import type { Suggestion } from "~/types/search";

type UseSearchSuggestionsOptions = {
  minLength?: number;
  limit?: number;
  enabled?: boolean;
  debounceMs?: number;
  endpoint?: string; // GET endpoint that returns { suggestions: Suggestion[] }
  countryCode?: string | null;
};

type UseSearchSuggestionsReturn = {
  results: Suggestion[];
  loading: boolean;
  networkLoading: boolean;
  debouncing: boolean;
  typingPending: boolean;
  hasSearched: boolean;
  hasShownResultsForCurrentInput: boolean;
  fetchNow: () => Promise<void>;
  error: Error | null;
};

export function useSearchSuggestions(
  query: string,
  options: UseSearchSuggestionsOptions = {},
): UseSearchSuggestionsReturn {
  const {
    minLength = 2,
    limit = 8,
    enabled = true,
    debounceMs = 180,
    endpoint = "/api/search/suggest",
    countryCode,
  } = options;

  const [results, setResults] = useState<Suggestion[]>([]);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [debouncing, setDebouncing] = useState(false);
  const [typingPending, setTypingPending] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [hasShownResultsForCurrentInput, setHasShownResultsForCurrentInput] =
    useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestQueryRef = useRef<string>("");
  const inFlightQueryRef = useRef<string | null>(null);
  const lastCompletedQueryRef = useRef<string>("");
  const debouncingGuardTimeoutRef = useRef<number | null>(null);
  const prevLenRef = useRef<number>(0);

  const trimmedQuery = query.trim();
  const debounced = useDebounce(trimmedQuery, debounceMs);

  const clearDebouncingGuard = useCallback(() => {
    if (debouncingGuardTimeoutRef.current) {
      window.clearTimeout(debouncingGuardTimeoutRef.current);
      debouncingGuardTimeoutRef.current = null;
    }
  }, []);

  const cancelOngoing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    inFlightQueryRef.current = null;
  }, []);

  const resetForClearedQuery = useCallback(() => {
    cancelOngoing();
    latestQueryRef.current = "";
    lastCompletedQueryRef.current = "";
    prevLenRef.current = 0;
    clearDebouncingGuard();
    setResults([]);
    setError(null);
    setDebouncing(false);
    setTypingPending(false);
    setNetworkLoading(false);
    setHasSearched(false);
    setHasShownResultsForCurrentInput(false);
  }, [cancelOngoing, clearDebouncingGuard]);

  // Track typing state for debouncing and pending-fetch indicators.
  useEffect(() => {
    if (!enabled) {
      cancelOngoing();
      clearDebouncingGuard();
      setDebouncing(false);
      setTypingPending(false);
      setNetworkLoading(false);
      return;
    }

    const previousQuery = latestQueryRef.current;
    latestQueryRef.current = trimmedQuery;

    if (!trimmedQuery) {
      resetForClearedQuery();
    } else {
      if (previousQuery !== trimmedQuery) {
        lastCompletedQueryRef.current = "";
        setResults([]);
        setError(null);
        setHasSearched(false);
        setHasShownResultsForCurrentInput(false);
      }

      setTypingPending(true);

      if (trimmedQuery.length >= minLength) {
        setDebouncing(true);
        clearDebouncingGuard();
        const queryAtSchedule = trimmedQuery;
        debouncingGuardTimeoutRef.current = window.setTimeout(() => {
          if (latestQueryRef.current !== queryAtSchedule) return;
          if (inFlightQueryRef.current === queryAtSchedule) return;
          setDebouncing(false);
          setTypingPending(false);
          debouncingGuardTimeoutRef.current = null;
        }, debounceMs + 800);
      } else {
        cancelOngoing();
        lastCompletedQueryRef.current = "";
        setResults([]);
        setError(null);
        setHasSearched(false);
        setHasShownResultsForCurrentInput(false);
        setDebouncing(false);
        clearDebouncingGuard();
        const queryAtSchedule = trimmedQuery;
        debouncingGuardTimeoutRef.current = window.setTimeout(() => {
          if (latestQueryRef.current !== queryAtSchedule) return;
          if (inFlightQueryRef.current === queryAtSchedule) return;
          setTypingPending(false);
          debouncingGuardTimeoutRef.current = null;
        }, debounceMs);
      }
    }
  }, [
    clearDebouncingGuard,
    cancelOngoing,
    debounceMs,
    enabled,
    minLength,
    trimmedQuery,
    resetForClearedQuery,
  ]);

  const doFetch = useCallback(
    async (q: string) => {
      if (!enabled) return;
      if (!q || q.length < minLength) return;
      if (lastCompletedQueryRef.current === q) return;

      cancelOngoing();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      inFlightQueryRef.current = q;

      setError(null);
      setDebouncing(false);
      setNetworkLoading(true);
      setTypingPending(true);

      try {
        const { suggestions } = await fetchSearchSuggestions({
          endpoint,
          query: q,
          limit,
          countryCode,
          signal: controller.signal,
        });
        if (controller.signal.aborted || latestQueryRef.current !== q) {
          return;
        }
        setResults(suggestions);
        setHasSearched(true);
        if (suggestions.length > 0) {
          setHasShownResultsForCurrentInput(true);
        }
        lastCompletedQueryRef.current = q;
      } catch (err) {
        if (controller.signal.aborted || latestQueryRef.current !== q) {
          return;
        }
        setResults([]);
        setHasSearched(true);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
          setNetworkLoading(false);
          if (latestQueryRef.current === q) {
            setTypingPending(false);
          }
        }
        if (inFlightQueryRef.current === q) {
          inFlightQueryRef.current = null;
        }
      }
    },
    [enabled, endpoint, limit, minLength, countryCode, cancelOngoing],
  );

  // Debounced fetching while typing
  useEffect(() => {
    if (!enabled) return;
    if (!debounced || debounced.length < minLength) {
      return;
    }
    if (lastCompletedQueryRef.current === debounced) {
      return;
    }
    void doFetch(debounced);
  }, [debounced, enabled, minLength, doFetch]);

  // Immediate fetch when crossing threshold upward (reduces perceived lag)
  useEffect(() => {
    if (!enabled) return;
    const prevLen = prevLenRef.current;
    const currLen = trimmedQuery.length;
    // Detect transition from below threshold to >= threshold
    if (prevLen < minLength && currLen >= minLength) {
      if (lastCompletedQueryRef.current === trimmedQuery) {
        prevLenRef.current = currLen;
        return;
      }
      void doFetch(trimmedQuery);
    }
    prevLenRef.current = currLen;
  }, [trimmedQuery, enabled, minLength, doFetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cancelOngoing();
  }, [cancelOngoing]);

  const fetchNow = useCallback(async () => {
    await doFetch(trimmedQuery);
  }, [doFetch, trimmedQuery]);

  return {
    results,
    loading: networkLoading,
    networkLoading,
    debouncing,
    typingPending,
    hasSearched,
    hasShownResultsForCurrentInput,
    fetchNow,
    error,
  };
}
