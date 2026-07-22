"use client";

import { Check, ChevronsUpDown, Loader, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import * as PopoverBase from "~/components/ui/popover";
import * as PopoverInDialog from "~/components/ui/popover-in-dialog";
import { GetGearDisplayName } from "~/lib/gear/naming";
import { mapGearSuggestionsToOptions } from "~/lib/search/gear-picker-options";
import { useCountry } from "~/lib/hooks/useCountry";
import { useDebounce } from "~/lib/hooks/useDebounce";
import { cn } from "~/lib/utils";
import type { GearAlias } from "~/types/gear";
import type { Suggestion } from "~/types/search";

export type GearOption = {
  id: string;
  slug: string;
  name: string;
  regionalAliases?: GearAlias[] | null;
  brandName?: string | null;
  gearType?: string | null;
  thumbnailUrl?: string | null;
  mountValue?: string | null;
};

type GearSearchFilters = {
  brand?: string;
  mount?: string;
  gearType?: string;
  sensorFormat?: string;
};

export type GearSearchComboboxProps = {
  value: GearOption | null;
  setValue: (value: GearOption | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  limit?: number;
  minChars?: number;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  allowClear?: boolean;
  filters?: GearSearchFilters;
  excludeIds?: string[];
  name?: string;
  serializeValue?: (value: GearOption | null) => string;
  onSelectionChange?: (value: GearOption | null) => void;
  fullWidth?: boolean;
  disableTriggerMeasurement?: boolean;
  inDialog?: boolean;
  renderTrigger?: (details: {
    open: boolean;
    selection: GearOption | null;
    canClear: boolean;
  }) => ReactNode;
};

type SuggestApiResult = {
  suggestions?: Suggestion[];
};

const defaultSerialize = (option: GearOption | null) => option?.slug ?? "";

export function GearSearchCombobox({
  value,
  setValue,
  placeholder = "Select gear",
  searchPlaceholder = "Search gear…",
  emptyText = "No gear found",
  limit = 12,
  minChars = 2,
  disabled = false,
  className,
  buttonClassName,
  allowClear = true,
  filters,
  excludeIds = [],
  name,
  serializeValue = defaultSerialize,
  onSelectionChange,
  fullWidth = true,
  disableTriggerMeasurement = false,
  inDialog,
  renderTrigger,
}: GearSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<GearOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [detectedInDialog, setDetectedInDialog] = useState(false);
  const debouncedQuery = useDebounce(query, 200);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [triggerWidth, setTriggerWidth] = useState<number | undefined>(
    undefined,
  );
  const shouldMeasureTrigger = !renderTrigger && !disableTriggerMeasurement;
  const { region, countryCode } = useCountry();

  const gearTypeFilter = filters?.gearType;

  useEffect(() => {
    if (containerRef.current) {
      const isInsideDialog = !!containerRef.current.closest(
        '[data-slot="dialog-content"]',
      );
      setDetectedInDialog(isInsideDialog);
    }
  }, []);

  const useDialogPopover = useMemo(
    () => (typeof inDialog === "boolean" ? inDialog : detectedInDialog),
    [inDialog, detectedInDialog],
  );
  const P = useDialogPopover ? PopoverInDialog : PopoverBase;

  const resetQuery = useCallback(() => {
    setQuery("");
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next) {
        resetQuery();
      }
    },
    [resetQuery],
  );

  useEffect(() => {
    if (!open) return;
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < minChars) {
      setOptions([]);
      setLoading(false);
      setError(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      q: trimmed,
      types: "gear",
      limit: String(limit),
    });
    if (countryCode) params.set("country", countryCode);
    if (gearTypeFilter) params.set("gearType", gearTypeFilter);

    const run = async () => {
      try {
        const res = await fetch(`/api/search/suggest?${params.toString()}`, {
          signal: controller.signal,
        });
        const data: SuggestApiResult = res.ok
          ? ((await res.json()) as SuggestApiResult)
          : { suggestions: [] };
        const suggestions = Array.isArray(data.suggestions)
          ? data.suggestions
          : [];
        const mapped = mapGearSuggestionsToOptions(suggestions, excludeIds).map(
          (option) => ({
            id: option.id,
            slug: option.slug,
            name: option.name,
            brandName: option.brandName,
            gearType: option.gearType,
          }),
        );
        setOptions(mapped);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setOptions([]);
        setError("Failed to load gear");
      } finally {
        setLoading(false);
      }
    };

    void run();

    return () => controller.abort();
  }, [
    countryCode,
    debouncedQuery,
    excludeIds,
    gearTypeFilter,
    limit,
    minChars,
    open,
  ]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useLayoutEffect(() => {
    if (!shouldMeasureTrigger) return;
    const node = triggerRef.current;
    if (!node) return;

    const updateWidth = () => {
      setTriggerWidth(node.offsetWidth > 0 ? node.offsetWidth : undefined);
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(node);

    return () => resizeObserver.disconnect();
  }, [shouldMeasureTrigger]);

  const updateSelection = useCallback(
    (option: GearOption | null, { closePopover = true } = {}) => {
      setValue(option);
      onSelectionChange?.(option);
      if (closePopover) {
        setOpen(false);
      }
      resetQuery();
    },
    [onSelectionChange, resetQuery, setValue],
  );

  const handleSelect = useCallback(
    (option: GearOption) => {
      updateSelection(option, { closePopover: true });
    },
    [updateSelection],
  );

  const handleClear = useCallback(
    ({ closePopover = true }: { closePopover?: boolean } = {}) => {
      updateSelection(null, { closePopover });
    },
    [updateSelection],
  );

  const buttonLabel = value
    ? GetGearDisplayName(
        { name: value.name, regionalAliases: value.regionalAliases },
        { region },
      )
    : placeholder;

  const trimmedQuery = query.trim();
  const trimmedDebouncedQuery = debouncedQuery.trim();
  const canClearSelection = allowClear && !!value;
  const belowThreshold = trimmedQuery.length < minChars;
  const isDebouncing =
    trimmedQuery.length >= minChars && trimmedQuery !== trimmedDebouncedQuery;
  const showLoading = loading || isDebouncing;

  const emptyStateContent = useMemo(() => {
    if (belowThreshold) {
      return `Type at least ${minChars} character${minChars === 1 ? "" : "s"}`;
    }
    if (showLoading) {
      return (
        <span className="inline-flex items-center gap-2">
          <Loader className="size-4 animate-spin" />
          Searching…
        </span>
      );
    }
    if (error) return error;
    return emptyText;
  }, [belowThreshold, emptyText, error, minChars, showLoading]);

  const triggerContent = renderTrigger ? (
    renderTrigger({
      open,
      selection: value,
      canClear: canClearSelection,
    })
  ) : (
    <Button
      type="button"
      variant="outline"
      role="combobox"
      aria-expanded={open}
      disabled={disabled}
      ref={triggerRef}
      className={cn(
        fullWidth
          ? "w-full justify-between text-left"
          : "justify-between text-left",
        buttonClassName,
      )}
    >
      <span
        className={cn(
          "truncate",
          value ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {buttonLabel}
      </span>
      <span className="flex items-center">
        {canClearSelection ? (
          <button
            type="button"
            aria-label="Clear selection"
            className="text-muted-foreground hover:text-foreground rounded-sm p-1 transition"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              handleClear({ closePopover: false });
            }}
          >
            <X className="size-4" />
          </button>
        ) : (
          <ChevronsUpDown className="size-4 opacity-50" />
        )}
      </span>
    </Button>
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col gap-2",
        fullWidth ? "w-full" : "w-auto",
        className,
      )}
    >
      {name ? (
        <input
          type="hidden"
          name={name}
          value={serializeValue(value)}
          readOnly
        />
      ) : null}
      <div
        className={cn(
          "flex items-center gap-2",
          fullWidth ? "w-full" : "w-auto",
        )}
      >
        <P.Popover open={open} onOpenChange={handleOpenChange}>
          <P.PopoverTrigger asChild>{triggerContent}</P.PopoverTrigger>
          <P.PopoverContent
            className="overflow-hidden p-0"
            align="start"
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              const popoverContentElement = event.currentTarget;
              if (!(popoverContentElement instanceof HTMLElement)) return;
              const searchInputElement = popoverContentElement.querySelector(
                '[data-slot="command-input"]',
              );
              if (searchInputElement instanceof HTMLInputElement) {
                searchInputElement.focus();
              }
            }}
            style={shouldMeasureTrigger ? { width: triggerWidth } : undefined}
          >
            <Command shouldFilter={false} className="overflow-hidden">
              <CommandInput
                value={query}
                onValueChange={setQuery}
                placeholder={searchPlaceholder}
              />
              <CommandList className="max-h-[min(300px,var(--radix-popover-content-available-height,300px))]">
                <CommandEmpty>{emptyStateContent}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => {
                    const isSelected = value?.id === option.id;
                    return (
                      <CommandItem
                        key={option.id}
                        value={option.slug}
                        onSelect={() => handleSelect(option)}
                        className="flex items-center gap-3"
                      >
                        <Check
                          className={cn(
                            "size-4",
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-medium">
                            {GetGearDisplayName(
                              {
                                name: option.name,
                                regionalAliases: option.regionalAliases,
                              },
                              { region },
                            )}
                          </span>
                          <span className="text-muted-foreground truncate text-xs">
                            {option.brandName ?? "Unknown brand"}
                          </span>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                          {option.gearType ? (
                            <span className="text-muted-foreground border-muted-foreground/20 rounded-full border px-2 py-0.5 text-[11px] tracking-wide uppercase">
                              {option.gearType}
                            </span>
                          ) : null}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </P.PopoverContent>
        </P.Popover>
      </div>
    </div>
  );
}

export default GearSearchCombobox;
