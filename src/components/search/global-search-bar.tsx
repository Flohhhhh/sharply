"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search as SearchIcon, Clock, X, Loader2 } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { mergeSearchParams } from "@utils/url";

type GlobalSearchBarProps = {
  placeholder?: string;
  className?: string;
};

const RECENT_SEARCHES_KEY = "sharply-recent-searches";
const MAX_RECENT_SEARCHES = 8;

export function GlobalSearchBar({
  placeholder = "Search gear…",
  className,
}: GlobalSearchBarProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [value, setValue] = useState<string>(sp.get("q") ?? "");
  const [showRecent, setShowRecent] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;

    const trimmed = query.trim();
    setRecentSearches((prev) => {
      const filtered = prev.filter((q) => q !== trimmed);
      const newRecent = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);

      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newRecent));
      } catch {
        // Ignore localStorage errors
      }

      return newRecent;
    });
  };

  // Keep input in sync when navigating via back/forward
  useEffect(() => {
    setValue(sp.get("q") ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.toString()]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowRecent(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isMac = useMemo(() => {
    if (typeof window === "undefined") return true;
    return navigator.platform.toUpperCase().includes("MAC");
  }, []);

  function submit(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;

    saveRecentSearch(trimmed);
    setShowRecent(false);
    setLoading(true); // Start loading

    const existing = new URLSearchParams(sp.toString());
    const qs = mergeSearchParams(existing, { q: trimmed, page: 1 });
    const href = qs ? `${"/search"}?${qs}` : "/search";

    // Navigate and clear loading after a short delay
    router.push(href);
    setTimeout(() => {
      setLoading(false);
    }, 500); // Clear loading after 500ms
  }

  function handleRecentSearchClick(recentQuery: string) {
    setValue(recentQuery);
    setLoading(true); // Start loading
    submit(recentQuery);
  }

  function removeRecentSearch(queryToRemove: string, e: React.MouseEvent) {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const filtered = prev.filter((q) => q !== queryToRemove);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(filtered));
      } catch {
        // Ignore localStorage errors
      }
      return filtered;
    });
  }

  function clearAllRecent() {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore localStorage errors
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      submit(value);
    }
  }

  return (
    <div className={className}>
      <div className="relative">
        <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />

        {/* Input wrapper - not a form to avoid nested button issues */}
        <div className="relative">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setShowRecent(e.target.value.length < 2);
            }}
            onFocus={() => {
              if (value.length < 2) setShowRecent(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pr-14 pl-9"
            aria-label="Global search"
          />
        </div>

        {/* Loading spinner */}
        {loading && (
          <div className="absolute top-1/2 right-12 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            // Hint button triggers command palette via custom event
            document.dispatchEvent(
              new CustomEvent("sharply:open-command-palette"),
            );
          }}
          className="text-muted-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-md border px-1.5 py-0.5 text-[10px] leading-none"
          aria-label="Open command palette"
          title={isMac ? "Command Palette (⌘K)" : "Command Palette (Ctrl+K)"}
        >
          {isMac ? "⌘K" : "Ctrl K"}
        </button>

        {/* Recent searches dropdown - positioned outside the input wrapper */}
        {showRecent && recentSearches.length > 0 && (
          <div
            ref={dropdownRef}
            className="bg-background absolute top-full right-0 left-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-md border shadow-lg"
          >
            <div className="border-b p-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm font-medium">
                  Recent searches
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllRecent}
                  className="h-6 px-2 text-xs"
                >
                  Clear all
                </Button>
              </div>
            </div>

            <div className="py-1">
              {recentSearches.map((recentQuery, index) => (
                <div
                  key={`${recentQuery}-${index}`}
                  className="hover:bg-accent group flex w-full items-center justify-between px-3 py-2"
                >
                  <button
                    onClick={() => handleRecentSearchClick(recentQuery)}
                    className="flex min-w-0 flex-1 items-center text-left"
                  >
                    <Clock className="text-muted-foreground mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{recentQuery}</span>
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => removeRecentSearch(recentQuery, e)}
                    className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
