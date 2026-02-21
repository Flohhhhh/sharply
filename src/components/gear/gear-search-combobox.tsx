"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronsUpDown, Check, Loader, X } from "lucide-react";
import { cn } from "~/lib/utils";
import { useDebounce } from "~/lib/hooks/useDebounce";
import { GetGearDisplayName } from "~/lib/gear/naming";
import { useCountry } from "~/lib/hooks/useCountry";
import type { GearAlias } from "~/types/gear";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

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
  renderTrigger?: (details: {
    open: boolean;
    selection: GearOption | null;
    canClear: boolean;
  }) => ReactNode;
};

type SearchApiResult = {
  results?: Array<{
    id: string;
    slug: string;
    name: string;
    regionalAliases?: GearAlias[] | null;
    brandName?: string | null;
    gearType?: string | null;
    thumbnailUrl?: string | null;
    mountValue?: string | null;
  }>;
};

const defaultSerialize = (option: GearOption | null) => option?.slug ?? "";

export function GearSearchCombobox({
  value,
  setValue,
  placeholder = "Select gear",
  searchPlaceholder = "Search gear…",
  emptyText = "No gear found",
  limit = 8,
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
  renderTrigger,
}: GearSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<GearOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debouncedQuery = useDebounce(query, 200);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [triggerWidth, setTriggerWidth] = useState<number | undefined>(
    undefined,
  );
  const shouldMeasureTrigger = !renderTrigger && !disableTriggerMeasurement;
  const { region } = useCountry();

  const brandFilter = filters?.brand;
  const mountFilter = filters?.mount;
  const gearTypeFilter = filters?.gearType;
  const sensorFormatFilter = filters?.sensorFormat;

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
      sort: "relevance",
      page: "1",
      pageSize: String(limit),
    });
    if (brandFilter) params.set("brand", brandFilter);
    if (mountFilter) params.set("mount", mountFilter);
    if (gearTypeFilter) params.set("gearType", gearTypeFilter);
    if (sensorFormatFilter) params.set("sensorFormat", sensorFormatFilter);

    const run = async () => {
      try {
        const res = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
        });
        const data: SearchApiResult = res.ok
          ? ((await res.json()) as SearchApiResult)
          : { results: [] };
        const list = Array.isArray(data.results) ? data.results : [];
        const mapped: GearOption[] = list
          .filter((item) => item?.slug && item?.name)
          .filter((item) => !excludeIds.includes(String(item.id)))
          .map((item) => ({
            id: String(item.id),
            slug: String(item.slug),
            name: String(item.name),
            regionalAliases: item.regionalAliases ?? null,
            brandName: item.brandName ?? null,
            gearType: item.gearType ?? null,
            thumbnailUrl: item.thumbnailUrl ?? null,
            mountValue: item.mountValue ?? null,
          }));
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
    brandFilter,
    debouncedQuery,
    excludeIds,
    gearTypeFilter,
    limit,
    minChars,
    mountFilter,
    open,
    sensorFormatFilter,
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
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>{triggerContent}</PopoverTrigger>
          <PopoverContent
            className="p-0"
            align="start"
            onOpenAutoFocus={(event) => event.preventDefault()}
            style={shouldMeasureTrigger ? { width: triggerWidth } : undefined}
          >
            <Command shouldFilter={false}>
              <CommandInput
                value={query}
                onValueChange={setQuery}
                placeholder={searchPlaceholder}
              />
              <CommandList>
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
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export default GearSearchCombobox;
