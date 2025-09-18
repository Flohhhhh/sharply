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
import { AddToCompareButton } from "~/components/compare/add-to-compare-button";
import { useCompare } from "~/lib/hooks/useCompare";
import { useSearchSuggestions } from "@hooks/useSearchSuggestions";
import type { Suggestion } from "~/types/search";

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { results, loading, debouncing, hasSearched, fetchNow } =
    useSearchSuggestions(query, { debounceMs: 200, minLength: 2 });

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
    document.addEventListener("sharply:open-command-palette", handler);
    return () =>
      document.removeEventListener("sharply:open-command-palette", handler);
  }, []);

  // When opened, focus input and refresh results for current query
  useEffect(() => {
    if (!open) return;
    // Focus input soon after dialog opens
    const t = setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    // If query already has enough chars, fetch immediately (not debounced)
    if (query && query.length >= 2) {
      void fetchNow();
    }

    return () => clearTimeout(t);
  }, [open]);

  // Fire immediate fetch when the user crosses the length threshold upward (while open)
  useEffect(() => {
    if (!open) return;
    if (query.length === 2) {
      void fetchNow();
    }
  }, [query, open, fetchNow]);

  // Cleanup handled inside hook

  const handleSeeAllResults = () => {
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
      <CommandInput
        ref={inputRef}
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
                        className="group/item"
                        onSelect={() => {
                          setOpen(false);
                          router.push(s.href);
                        }}
                      >
                        <div className="flex w-full items-center gap-2">
                          <div className="flex-1 truncate">{s.label}</div>
                          {s.relevance !== undefined && (
                            <span className="text-muted-foreground ml-2 text-xs">
                              {Math.round(s.relevance * 100)}%
                            </span>
                          )}
                          {/* Add to compare on hover (gear suggestions only) */}
                          {s.type === "gear" && (
                            <div className="opacity-0 transition-opacity group-hover/item:opacity-100">
                              <AddToCompareButton
                                slug={s.href.replace("/gear/", "")}
                                name={s.label}
                                size="sm"
                                className="px-2"
                                iconStyle="scalePlus"
                              />
                            </div>
                          )}
                        </div>
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
