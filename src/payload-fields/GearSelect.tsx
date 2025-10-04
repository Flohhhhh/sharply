"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  useField,
  SelectInput,
  FieldLabel,
  FieldDescription,
} from "@payloadcms/ui";
import { Loader2 } from "lucide-react";

type Suggestion = {
  id: string;
  label: string;
  href: string;
  type: "gear" | "brand";
  relevance?: number;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function extractSlugFromHref(href: string): string | null {
  // Expecting href like "/gear/<slug>"
  try {
    const parts = href.split("/").filter(Boolean);
    const idx = parts.indexOf("gear");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1] as string;
    return null;
  } catch {
    return null;
  }
}

const GearSelect: React.FC<{
  name?: string;
  label?: string;
  description?: string;
  path?: string;
  field?: { name?: string; label?: string; admin?: { description?: string } };
}> = (props) => {
  const effectivePath =
    props.path ?? props.field?.name ?? props.name ?? "gear-slug";
  const effectiveLabel = props.field?.label ?? props.label ?? "Gear Item";
  const effectiveDescription =
    props.field?.admin?.description ?? props.description;

  const { value, setValue } = useField<string>({ path: effectivePath });

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncing, setDebouncing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cache for displaying labels of selected slug(s)
  const [labelBySlug, setLabelBySlug] = useState<Record<string, string>>({});

  const debouncedQuery = useDebounce(query, 250);

  // Track raw typing to show debouncing indicator before fetch kicks in
  const lastQueryRef = useRef("");
  useEffect(() => {
    if (query !== lastQueryRef.current && query.length >= 2) {
      setDebouncing(true);
    } else if (query.length < 2) {
      setDebouncing(false);
      setHasSearched(false);
      setResults([]);
      setError(null);
    }
    lastQueryRef.current = query;
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return;

    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setError(null);
    setDebouncing(false);
    setLoading(true);
    fetch(
      `/api/search/suggest?q=${encodeURIComponent(debouncedQuery)}&limit=8`,
      {
        signal: ac.signal,
      },
    )
      .then(async (res) => {
        if (!res.ok) return { suggestions: [] as Suggestion[] };
        return (await res.json()) as { suggestions?: Suggestion[] };
      })
      .then((data) => {
        const list = Array.isArray(data.suggestions) ? data.suggestions : [];
        // Only gear suggestions
        setResults(list.filter((s) => s.type === "gear"));
        setHasSearched(true);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setResults([]);
        setHasSearched(true);
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const isSearching = (loading || debouncing) && query.length >= 2;

  // Resolve label for current slug if needed
  useEffect(() => {
    const current = value ?? "";
    if (!current || labelBySlug[current]) return;
    const ac = new AbortController();
    fetch(`/api/search/suggest?q=${encodeURIComponent(current)}&limit=5`, {
      signal: ac.signal,
    })
      .then(async (res) =>
        res.ok
          ? ((await res.json()) as { suggestions?: Suggestion[] })
          : { suggestions: [] },
      )
      .then((data) => {
        const list = (data.suggestions ?? []).filter((s) => s.type === "gear");
        const exact = list.find((s) => extractSlugFromHref(s.href) === current);
        const candidate = exact ?? list[0];
        if (candidate) {
          setLabelBySlug((prev) => ({ ...prev, [current]: candidate.label }));
        }
      })
      .catch(() => {})
      .finally(() => {});
    return () => ac.abort();
  }, [value, labelBySlug]);

  // Options for SelectInput (inject loading/empty placeholders and selected option label)
  const options = useMemo(() => {
    const base = results.map((s) => ({
      label: s.label,
      value: extractSlugFromHref(s.href) ?? "",
    }));

    const list = [...base];

    // Ensure current selection has a labeled option
    if (value) {
      const exists = list.some((o) => o.value === value);
      if (!exists) {
        list.unshift({ label: labelBySlug[value] ?? value, value });
      }
    }

    if (isSearching && base.length === 0) {
      list.unshift({ label: "Searching…", value: "__loading__" });
    } else if (hasSearched && !isSearching && base.length === 0 && !value) {
      list.unshift({ label: "No results", value: "__empty__" });
    }

    return list;
  }, [results, isSearching, hasSearched, value, labelBySlug]);

  const placeholder = useMemo(() => {
    if (isSearching) return "Searching…";
    return "Search gear…";
  }, [isSearching]);

  // Keep placeholder options visible by disabling client-side filtering
  const filterOption = () => true;

  return (
    <div className="sharply-field flex flex-col gap-2 py-2">
      <FieldLabel label={effectiveLabel} path={effectivePath} />
      <SelectInput
        name={`${effectivePath}-select`}
        path={effectivePath}
        options={options}
        value={value ?? ""}
        placeholder={placeholder}
        isClearable
        filterOption={filterOption}
        onInputChange={(inputValue: string) => {
          setQuery(inputValue ?? "");
        }}
        onChange={(selected: any) => {
          const next = Array.isArray(selected) ? selected[0] : selected;
          const nextValue = next?.value ?? "";
          if (nextValue === "__loading__" || nextValue === "__empty__") return;
          // Cache label so it renders nicely even after options refresh
          if (next?.label && typeof next.label === "string") {
            setLabelBySlug((prev) => ({
              ...prev,
              [String(nextValue)]: String(next.label),
            }));
          }
          setValue(String(nextValue));
        }}
      />
      {effectiveDescription && (
        <FieldDescription
          description={effectiveDescription}
          path={effectivePath}
        />
      )}

      {error && !loading && (
        <div className="text-destructive text-xs">
          Failed to load suggestions.
        </div>
      )}
    </div>
  );
};

export default GearSelect;
