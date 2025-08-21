"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search as SearchIcon, Clock, X, Loader2 } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { mergeSearchParams } from "@utils/url";
import { cn } from "~/lib/utils";

type GlobalSearchBarProps = {
  placeholder?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const RECENT_SEARCHES_KEY = "sharply-recent-searches";
const MAX_RECENT_SEARCHES = 8;

const sizeVariants = {
  sm: {
    input: "h-8 text-sm rounded-md",
    icon: "size-3",
    button: "h-5 px-1 text-[9px]",
    dropdown: "mt-1 max-h-48",
    recentItem: "px-2 py-1.5",
    recentIcon: "h-3 w-3",
    clearButton: "h-5 px-1.5 text-xs",
    removeButton: "h-5 w-5",
    removeIcon: "h-2.5 w-2.5",
  },
  md: {
    input: "h-10 text-sm rounded-md",
    icon: "size-4",
    button: "h-6 px-1.5 text-[10px]",
    dropdown: "mt-1 max-h-64",
    recentItem: "px-3 py-2",
    recentIcon: "h-4 w-4",
    clearButton: "h-6 px-2 text-xs",
    removeButton: "h-6 w-6",
    removeIcon: "h-3 w-3",
  },
  lg: {
    input: "h-12 text-base rounded-lg",
    icon: "size-5",
    button: "h-7 px-2 text-xs",
    dropdown: "mt-1 max-h-80",
    recentItem: "px-4 py-2.5",
    recentIcon: "h-5 w-5",
    clearButton: "h-7 px-2.5 text-sm",
    removeButton: "h-7 w-7",
    removeIcon: "h-3.5 w-3.5",
  },
};

export function GlobalSearchBar({
  placeholder = "Search gear…",
  className,
  size = "md",
}: GlobalSearchBarProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [value, setValue] = useState<string>(sp.get("q") ?? "");
  const [showRecent, setShowRecent] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sizes = sizeVariants[size];

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
        <SearchIcon
          className={cn(
            "text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2",
            sizes.icon,
          )}
        />

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
            className={cn("pr-14 pl-9", sizes.input)}
            aria-label="Global search"
          />
        </div>

        {/* Loading spinner */}
        {loading && (
          <div className="absolute top-1/2 right-12 -translate-y-1/2">
            <Loader2 className={cn("animate-spin", sizes.icon)} />
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
          className={cn(
            "text-muted-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-md border",
            sizes.button,
          )}
          aria-label="Open command palette"
          title={isMac ? "Command Palette (⌘K)" : "Command Palette (Ctrl+K)"}
        >
          {isMac ? "⌘K" : "Ctrl K"}
        </button>

        {/* Recent searches dropdown - positioned outside the input wrapper */}
        {showRecent && recentSearches.length > 0 && (
          <div
            ref={dropdownRef}
            className={cn(
              "bg-background absolute top-full right-0 left-0 z-50 overflow-y-auto rounded-md border shadow-lg",
              sizes.dropdown,
            )}
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
                  className={cn("text-xs", sizes.clearButton)}
                >
                  Clear all
                </Button>
              </div>
            </div>

            <div className="py-1">
              {recentSearches.map((recentQuery, index) => (
                <div
                  key={`${recentQuery}-${index}`}
                  className={cn(
                    "hover:bg-accent group flex w-full items-center justify-between",
                    sizes.recentItem,
                  )}
                >
                  <button
                    onClick={() => handleRecentSearchClick(recentQuery)}
                    className="flex min-w-0 flex-1 items-center text-left"
                  >
                    <Clock
                      className={cn(
                        "text-muted-foreground mr-2 flex-shrink-0",
                        sizes.recentIcon,
                      )}
                    />
                    <span className="truncate">{recentQuery}</span>
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => removeRecentSearch(recentQuery, e)}
                    className={cn(
                      "p-0 opacity-0 transition-opacity group-hover:opacity-100",
                      sizes.removeButton,
                    )}
                  >
                    <X className={sizes.removeIcon} />
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
