"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsUpDownIcon, CheckIcon, SearchIcon } from "lucide-react";
import { cn } from "~/lib/utils";
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

export type GearSuggestion = {
  id: string; // gear id
  name: string;
  slug: string;
  gearType?: string | null;
  brandName?: string | null;
  type?: "gear" | "brand";
};

export type GearComboboxProps = {
  name?: string; // hidden input name for form submission
  placeholder?: string;
  defaultValueId?: string;
  defaultDisplay?: string; // label shown when default id is provided
  limit?: number; // suggestions limit
  onSelectedChange?: (item: GearSuggestion | null) => void;
  // Optional filter: only show lenses
  onlyLenses?: boolean; // kept for API compatibility; currently filters to gear results only
};

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function GearCombobox({
  name = "gearId",
  placeholder = "Search gear…",
  defaultValueId,
  defaultDisplay,
  limit = 8,
  onSelectedChange,
  onlyLenses = true,
}: GearComboboxProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>(defaultValueId ?? "");
  const [label, setLabel] = useState<string>(defaultDisplay ?? "");
  const [input, setInput] = useState("");
  const debounced = useDebounced(input, 200);
  const abortRef = useRef<AbortController | null>(null);
  const [options, setOptions] = useState<GearSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch suggestions
  useEffect(() => {
    const q = debounced.trim();
    if (q.length < 2) {
      setOptions([]);
      return;
    }
    abortRef.current?.abort();
    const aborter = new AbortController();
    abortRef.current = aborter;
    setLoading(true);
    const run = async () => {
      try {
        if (onlyLenses) {
          // Use full search for richer fields then filter to lenses client-side
          const r = await fetch(
            `/api/search?q=${encodeURIComponent(q)}&page=1&pageSize=${limit}&sort=relevance`,
            { signal: aborter.signal },
          );
          const data = (await (r.ok ? r.json() : { results: [] })) as {
            results?: any[];
          };
          const rows = Array.isArray(data?.results) ? data.results : [];
          const mapped: GearSuggestion[] = rows
            .map((s: any) => ({
              id: String(s?.id ?? ""),
              name: String(s?.name ?? s?.slug ?? ""),
              slug: String(s?.slug ?? ""),
              gearType: s?.gearType ?? null,
              brandName: s?.brandName ?? null,
              type: "gear" as const,
            }))
            .filter((s) => s.id && s.name);
          setOptions(mapped.filter((m) => (m.gearType ?? "") === "LENS"));
        } else {
          const r = await fetch(
            `/api/search/suggest?q=${encodeURIComponent(q)}&limit=${limit}`,
            { signal: aborter.signal },
          );
          const data = (await (r.ok ? r.json() : { suggestions: [] })) as {
            suggestions?: any[];
          };
          const raw = Array.isArray(data?.suggestions) ? data.suggestions : [];
          const mapped: GearSuggestion[] = raw
            .map((s: any) => ({
              id: String(s?.id ?? "").replace(/^gear:/, ""),
              name: String(s?.label ?? s?.name ?? s?.slug ?? ""),
              slug: String(s?.slug ?? ""),
              gearType: s?.gearType ?? null,
              brandName: s?.brandName ?? null,
              type:
                (s?.type as "gear" | "brand" | undefined) ||
                (String(s?.id ?? "").startsWith("gear:") ? "gear" : undefined),
            }))
            .filter((s) => s.id && s.name);
          setOptions(mapped.filter((m) => m.type === "gear"));
        }
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [debounced, limit, onlyLenses]);

  const display = useMemo(() => {
    if (label) return label;
    if (!value) return undefined;
    const current = options.find((o) => o.id === value);
    return current?.name;
  }, [label, value, options]);

  return (
    <div className="w-full">
      <input type="hidden" name={name} value={value} readOnly />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {display ?? "+ Select gear"}
            <ChevronsUpDownIcon className="ml-2 size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[420px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={placeholder}
              value={input}
              onValueChange={setInput}
            />
            <CommandList>
              <CommandEmpty>
                {loading ? "Searching…" : "No results"}
              </CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.id}
                    value={opt.name}
                    onSelect={() => {
                      setValue(opt.id);
                      setLabel(opt.name);
                      onSelectedChange?.(opt);
                      setOpen(false);
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === opt.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="font-medium">{opt.name}</span>
                    {opt.brandName ? (
                      <span className="text-muted-foreground ml-2 text-xs">
                        {opt.brandName}
                      </span>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default GearCombobox;
