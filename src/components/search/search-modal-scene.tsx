"use client";

import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Camera,
  CircleDot,
  Loader2,
  Search as SearchIcon,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useSearchSuggestions } from "@hooks/useSearchSuggestions";
import { useCountry } from "~/lib/hooks/useCountry";
import { cn } from "~/lib/utils";
import { buildSearchHref } from "~/lib/utils/url";
import type { Suggestion } from "~/types/search";
import { SearchSuggestionRow } from "./search-suggestion-row";
import {
  getSuggestionKind,
  getSuggestionMeta,
  getSuggestionSubtitle,
  getSuggestionTitle,
  isBestMatchSuggestion,
  isSmartActionSuggestion,
} from "./search-suggestion-utils";

type SearchModalSceneProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type SuggestionRow = {
  id: string;
  kind: Suggestion["kind"];
  suggestion: Suggestion;
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: string;
  href: string;
};

type SearchActionItem = {
  id: string;
  kind: "search-action";
  title: string;
  href: string;
};

type SelectableItem = SuggestionRow | SearchActionItem;

function getLeadingIcon(suggestion: Suggestion) {
  if (suggestion.kind === "smart-action") {
    return <Sparkles className="size-5" />;
  }
  if (suggestion.kind === "camera") {
    return <Camera className="size-5" />;
  }
  if (suggestion.kind === "lens") {
    return <CircleDot className="size-5" />;
  }
  return <SearchIcon className="size-5" />;
}

function isSuggestionRow(item: SelectableItem): item is SuggestionRow {
  return "suggestion" in item;
}

export function SearchModalScene({
  open,
  onOpenChange,
}: SearchModalSceneProps) {
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const rowRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasRevealedPanelForInput, setHasRevealedPanelForInput] = useState(false);
  const { countryCode } = useCountry();

  const { results, networkLoading, typingPending, hasShownResultsForCurrentInput } =
    useSearchSuggestions(query, {
      debounceMs: 180,
      minLength: 2,
      countryCode,
    });

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length >= 2;
  const isSearching = hasQuery && (typingPending || networkLoading);
  const searchHref = buildSearchHref("/search", { q: trimmedQuery, page: 1 });

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedIndex(0);
      setHasRevealedPanelForInput(false);
      return;
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 10);

    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!hasQuery) {
      setHasRevealedPanelForInput(false);
      return;
    }

    if (hasShownResultsForCurrentInput) {
      setHasRevealedPanelForInput(true);
      return;
    }

    if (!typingPending && !networkLoading) {
      setHasRevealedPanelForInput(true);
    }
  }, [
    hasQuery,
    hasShownResultsForCurrentInput,
    networkLoading,
    typingPending,
  ]);

  const suggestionRows = useMemo(() => {
    const mapped: SuggestionRow[] = results.map((suggestion) => ({
      id: suggestion.id,
      kind: suggestion.kind,
      suggestion,
      title: getSuggestionTitle(suggestion),
      subtitle: getSuggestionSubtitle(suggestion),
      meta: getSuggestionMeta(suggestion),
      badge: isSmartActionSuggestion(suggestion)
        ? "Compare"
        : isBestMatchSuggestion(suggestion)
          ? "Best match"
          : undefined,
      href: suggestion.href,
    }));

    return {
      smartRows: mapped.filter((row) => isSmartActionSuggestion(row.suggestion)),
      bestRows: mapped.filter((row) => isBestMatchSuggestion(row.suggestion)),
      remainingRows: mapped.filter(
        (row) =>
          !isSmartActionSuggestion(row.suggestion) &&
          !isBestMatchSuggestion(row.suggestion),
      ),
    };
  }, [results]);

  const selectableItems = useMemo<SelectableItem[]>(() => {
    if (!hasQuery) return [];

    const items: SelectableItem[] = [
      ...suggestionRows.smartRows,
      ...suggestionRows.bestRows,
      {
        id: "search-action",
        kind: "search-action",
        title: `Search for “${trimmedQuery}”`,
        href: searchHref,
      },
      ...suggestionRows.remainingRows,
    ];

    return items;
  }, [hasQuery, searchHref, suggestionRows, trimmedQuery]);

  const showResultsSection = hasQuery ? hasRevealedPanelForInput : false;
  const shellTransition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, duration: 100, stiffness: 400, damping: 30, mass: 0.95 };
  const panelTransition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, duration: 100, stiffness: 400, damping: 30, mass: 0.82 };

  useEffect(() => {
    rowRefs.current = rowRefs.current.slice(0, selectableItems.length);

    if (selectableItems.length === 0) {
      setSelectedIndex(-1);
      return;
    }

    setSelectedIndex((current) => {
      if (current < 0 || current >= selectableItems.length) {
        return 0;
      }
      return current;
    });
  }, [selectableItems]);

  useEffect(() => {
    if (selectedIndex < 0) return;
    rowRefs.current[selectedIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [selectedIndex]);

  const navigateTo = (href: string, queryForHistory?: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const executeItem = (item: SelectableItem | undefined) => {
    if (!item) return;
    navigateTo(item.href);
  };

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      if (selectableItems.length === 0) return;
      event.preventDefault();
      setSelectedIndex((current) =>
        current < 0 ? 0 : (current + 1) % selectableItems.length,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      if (selectableItems.length === 0) return;
      event.preventDefault();
      setSelectedIndex((current) =>
        current <= 0 ? selectableItems.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      if (selectableItems.length === 0) return;
      event.preventDefault();
      executeItem(selectableItems[selectedIndex] ?? selectableItems[0]);
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{
        height: showResultsSection ? 480 : 64,
      }}
      transition={shellTransition}
      className="bg-background dark:supports-backdrop-filter:bg-background/50 flex overflow-hidden rounded-2xl border border-black/40 dark:border-white/40 shadow-[0_28px_90px_-42px_rgba(0,0,0,0.88),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-16 shrink-0 items-center gap-3 px-5">
          <SearchIcon className="text-muted-foreground size-5 md:size-6 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search Sharply"
            className="placeholder:text-muted-foreground dark:placeholder:text-muted-foreground/60 text-foreground flex-1 bg-transparent text-sm outline-none md:text-lg"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="none"
          />
          <div className="flex min-w-8 justify-end">
            {isSearching ? (
              <Loader2 className="text-muted-foreground size-4 animate-spin" />
            ) : query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-muted-foreground hover:text-foreground inline-flex size-8 items-center justify-center rounded-full transition-colors"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {showResultsSection ? (
            <motion.div
              key="results-panel"
              initial={reduceMotion ? false : { opacity: 0, y: -10, scaleY: 0.985 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scaleY: 0.985 }}
              transition={panelTransition}
              className="min-h-0 flex-1 overflow-hidden origin-top"
            >
              <div className="h-full border-t border-white/8">
                <div className="h-full overflow-y-auto px-1 py-2">
                  {hasQuery ? (
                    <div className="space-y-1 px-1 py-1">
                      {selectableItems.map((item, index) => {
                        const selected = index === selectedIndex;

                        if (item.kind === "search-action") {
                          return (
                            <button
                              key={item.id}
                              ref={(element) => {
                                rowRefs.current[index] = element;
                              }}
                              type="button"
                              onMouseEnter={() => setSelectedIndex(index)}
                              onFocus={() => setSelectedIndex(index)}
                              onClick={() => executeItem(item)}
                              className="block w-full text-left outline-none"
                            >
                              <SearchSuggestionRow
                                kind="search-action"
                                tone="search-action"
                                surface="inline"
                                title={item.title}
                                actionLabel="Search"
                                selected={selected}
                                leadingIcon={<ArrowUpRight className="size-5" />}
                              />
                            </button>
                          );
                        }

                        return (
                          <button
                            key={item.id}
                            ref={(element) => {
                              rowRefs.current[index] = element;
                            }}
                            type="button"
                            onMouseEnter={() => setSelectedIndex(index)}
                            onFocus={() => setSelectedIndex(index)}
                            onClick={() => executeItem(item)}
                            className="block w-full text-left outline-none"
                          >
                            <SearchSuggestionRow
                              kind={getSuggestionKind(item.suggestion)}
                              surface="inline"
                              tone={
                                isSmartActionSuggestion(item.suggestion)
                                  ? "smart-action"
                                  : isBestMatchSuggestion(item.suggestion)
                                    ? "best-match"
                                    : "default"
                              }
                              title={item.title}
                              brandName={
                                item.suggestion.kind === "smart-action"
                                  ? undefined
                                  : item.suggestion.brandName ?? undefined
                              }
                              subtitle={item.subtitle}
                              meta={item.meta}
                              badge={item.badge}
                              actionLabel={
                                isSmartActionSuggestion(item.suggestion)
                                  ? "Compare items"
                                  : isBestMatchSuggestion(item.suggestion)
                                    ? "Best match"
                                  : item.suggestion.kind === "brand"
                                    ? "Open brand"
                                    : "Go to gear item"
                              }
                              selected={selected}
                              leadingIcon={getLeadingIcon(item.suggestion)}
                            />
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
