"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  useField,
  SelectInput,
  FieldLabel,
  FieldDescription,
} from "@payloadcms/ui";

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
  try {
    const parts = href.split("/").filter(Boolean);
    const idx = parts.indexOf("gear");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1] ?? null;
    return null;
  } catch {
    return null;
  }
}

function isAbortError(e: unknown): e is DOMException {
  return e instanceof DOMException && e.name === "AbortError";
}

function isOptionLike(
  value: unknown,
): value is { value?: unknown; label?: unknown } {
  return typeof value === "object" && value !== null;
}

const GearMultiSelect: React.FC<{
  name?: string;
  label?: string;
  description?: string;
  path?: string;
  field?: { name?: string; label?: string; admin?: { description?: string } };
}> = (props) => {
  const effectivePath =
    props.path ?? props.field?.name ?? props.name ?? "gear-slugs";
  const effectiveLabel = props.field?.label ?? props.label ?? "Gear Items";
  const effectiveDescription =
    props.field?.admin?.description ?? props.description;

  const { value, setValue } = useField<string[]>({
    path: effectivePath,
  });

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncing, setDebouncing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cache labels for selected slugs
  const [labelBySlug, setLabelBySlug] = useState<Record<string, string>>({});

  const debouncedQuery = useDebounce(query, 250);

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
      `/api/search/suggest?q=${encodeURIComponent(debouncedQuery)}&limit=10`,
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
        setResults(list.filter((s) => s.type === "gear"));
        setHasSearched(true);
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return;
        setResults([]);
        setHasSearched(true);
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const isSearching = (loading || debouncing) && query.length >= 2;

  // Backfill labels for existing selected slugs
  useEffect(() => {
    const slugs = (Array.isArray(value) ? value : []).filter(
      (s) => s && !labelBySlug[s],
    );
    if (slugs.length === 0) return;

    const ac = new AbortController();
    const q = slugs[0]!; // simple heuristic: fetch by first missing
    fetch(`/api/search/suggest?q=${encodeURIComponent(q)}&limit=10`, {
      signal: ac.signal,
    })
      .then(async (res) =>
        res.ok
          ? ((await res.json()) as { suggestions?: Suggestion[] })
          : { suggestions: [] },
      )
      .then((data) => {
        const list = (data.suggestions ?? []).filter((s) => s.type === "gear");
        const next: Record<string, string> = {};
        for (const s of list) {
          const slug = extractSlugFromHref(s.href);
          if (slug) next[slug] = s.label;
        }
        if (Object.keys(next).length > 0) {
          setLabelBySlug((prev) => ({ ...prev, ...next }));
        }
      })
      .catch(() => {
        /* ignore */
        return;
      })
      .finally(() => {
        /* ignore */
        return;
      });
    return () => ac.abort();
  }, [value, labelBySlug]);

  const options = useMemo(() => {
    const base = results.map((s) => ({
      label: s.label,
      value: extractSlugFromHref(s.href) ?? "",
    }));

    const list = [...base];

    // Ensure selected slugs are present with labels for rendering
    const selected = Array.isArray(value) ? value : [];
    for (const slug of selected) {
      if (!slug) continue;
      if (!list.some((o) => o.value === slug)) {
        list.unshift({ label: labelBySlug[slug] ?? slug, value: slug });
      }
    }

    if (isSearching && base.length === 0) {
      list.unshift({ label: "Searching…", value: "__loading__" });
    } else if (
      hasSearched &&
      !isSearching &&
      base.length === 0 &&
      selected.length === 0
    ) {
      list.unshift({ label: "No results", value: "__empty__" });
    }

    return list;
  }, [results, isSearching, hasSearched, value, labelBySlug]);

  const placeholder = useMemo(() => {
    if (isSearching) return "Searching…";
    return "Search and select related gear…";
  }, [isSearching]);

  const filterOption = () => true;

  return (
    <div className="sharply-field flex flex-col gap-2 py-2">
      <FieldLabel label={effectiveLabel} path={effectivePath} />
      <SelectInput
        name={`${effectivePath}-select`}
        path={effectivePath}
        options={options}
        value={Array.isArray(value) ? value : []}
        placeholder={placeholder}
        hasMany
        isClearable
        filterOption={filterOption}
        onInputChange={(inputValue: string) => {
          setQuery(inputValue ?? "");
        }}
        onChange={(selected: unknown) => {
          const arr = Array.isArray(selected)
            ? selected
            : selected
              ? [selected]
              : [];
          const optionArr = arr.filter(isOptionLike);
          const slugs = optionArr
            .map((opt) => opt.value)
            .filter((v): v is string => typeof v === "string");
          const filtered = slugs.filter(
            (v) => v !== "__loading__" && v !== "__empty__",
          );
          // Remember labels
          for (const opt of optionArr) {
            const v = opt?.value;
            const l = opt?.label;
            if (typeof v === "string" && typeof l === "string") {
              setLabelBySlug((prev) => ({ ...prev, [v]: l }));
            }
          }
          setValue(filtered);
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

export default GearMultiSelect;
