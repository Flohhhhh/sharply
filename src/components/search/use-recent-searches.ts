"use client";

import { useEffect, useState } from "react";

const RECENT_SEARCHES_KEY = "sharply-recent-searches";
const MAX_RECENT_SEARCHES = 8;

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors.
    }
  }, []);

  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setRecentSearches((current) => {
      const next = [trimmed, ...current.filter((item) => item !== trimmed)].slice(
        0,
        MAX_RECENT_SEARCHES,
      );

      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {
        // Ignore localStorage errors.
      }

      return next;
    });
  };

  const removeRecentSearch = (queryToRemove: string) => {
    setRecentSearches((current) => {
      const next = current.filter((query) => query !== queryToRemove);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {
        // Ignore localStorage errors.
      }
      return next;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore localStorage errors.
    }
  };

  return {
    recentSearches,
    saveRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  };
}
