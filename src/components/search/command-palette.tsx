"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Bird, Loader2, SearchIcon } from "lucide-react";
import { useDebounce } from "@hooks/useDebounce";

type Suggestion = {
  id: string;
  label: string;
  href: string;
  type: "gear" | "brand";
  relevance?: number;
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 200);
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncing, setDebouncing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Keyboard shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Programmatic open
  useEffect(() => {
    const handler = () => setOpen(true);
    document.addEventListener(
      "sharply:open-command-palette",
      handler as EventListener,
    );
    return () =>
      document.removeEventListener(
        "sharply:open-command-palette",
        handler as EventListener,
      );
  }, []);

  // When opened, focus input and refresh results for current query
  useEffect(() => {
    if (!open) return;
    // Clear stale results if query is empty
    if (!query) setResults([]);

    // Focus input soon after dialog opens
    const t = setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    // If query already has enough chars, fetch immediately (not debounced)
    if (query && query.length >= 2) {
      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setLoading(true); // Set loading state

      void fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`, {
        signal: abortControllerRef.current.signal,
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => setResults((data?.suggestions as Suggestion[]) ?? []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false)); // Clear loading state
    }

    return () => clearTimeout(t);
  }, [open]);

  // Show debouncing state when user is typing
  useEffect(() => {
    if (query && query.length >= 2) {
      setDebouncing(true);
      setHasSearched(false); // Reset search state when typing new query
    } else {
      setDebouncing(false);
      setHasSearched(false);
    }
  }, [query]);

  // Fetch suggestions (debounced while typing)
  useEffect(() => {
    if (!debounced || debounced.length < 2) {
      setResults([]);
      setDebouncing(false);
      setHasSearched(false);
      return;
    }

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setDebouncing(false); // Stop debouncing, start actual loading
    setLoading(true);

    void fetch(`/api/search/suggest?q=${encodeURIComponent(debounced)}`, {
      signal: abortControllerRef.current.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setResults((data?.suggestions as Suggestion[]) ?? []);
        setHasSearched(true); // Mark that we've completed a search
      })
      .catch(() => {
        setResults([]);
        setHasSearched(true);
      })
      .finally(() => setLoading(false));

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debounced]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSeeAllResults = () => {
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
      <CommandInput
        ref={inputRef as any}
        value={query}
        onValueChange={setQuery}
        placeholder="Search gear, brands, users…"
      />
      <CommandList className="min-h-[200px]">
        {/* Initial state - show when no query or query too short */}
        {(!query || query.length < 2) && (
          <div className="text-muted-foreground flex items-center justify-center py-8 text-sm">
            {/* <SearchIcon className="text-muted-foreground mr-2 h-5 w-5" /> */}
            Type to search...
          </div>
        )}

        {/* Search state - show when typing or searching */}
        {query && query.length >= 2 && (
          <>
            {/* See all results action - always visible when query has content */}
            <CommandGroup>
              <CommandItem onSelect={handleSeeAllResults}>
                <div className="flex items-center">
                  <SearchIcon className="mr-2 h-4 w-4" />
                  See all results for "{query}"
                </div>
              </CommandItem>
            </CommandGroup>

            {/* Loading state - show when debouncing or searching */}
            {(loading || debouncing) && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}

            {/* Results or no results - only show after search completes */}
            {hasSearched && !loading && !debouncing && (
              <>
                {results.length > 0 ? (
                  <CommandGroup heading="Suggestions">
                    {results.map((s) => (
                      <CommandItem
                        key={s.id}
                        onSelect={() => {
                          setOpen(false);
                          router.push(s.href);
                        }}
                      >
                        {s.label}
                        {s.relevance !== undefined && (
                          <span className="text-muted-foreground ml-auto text-xs">
                            {Math.round(s.relevance * 100)}%
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : (
                  <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 py-4 text-center text-sm">
                    <Bird className="h-8 w-8 blur-[1px]" />
                    Oops, we missed the shot.
                    <br />
                    Try a different search.
                  </div>
                )}
              </>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
