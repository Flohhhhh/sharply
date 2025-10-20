import type { ChartColumn } from "./types";

export const DEFAULT_ZOOM_COLUMNS: ChartColumn[] = [
  { key: "zoom-ultrawide", label: "Ultrawide", group: "zoom", order: 1 },
  { key: "zoom-wide", label: "Wide", group: "zoom", order: 2 },
  { key: "zoom-standard", label: "Standard", group: "zoom", order: 3 },
  { key: "zoom-telephoto", label: "Telephoto", group: "zoom", order: 4 },
  {
    key: "zoom-supertelephoto",
    label: "Supertelephoto",
    group: "zoom",
    order: 5,
  },
  { key: "zoom-superzoom", label: "Superzoom", group: "zoom", order: 6 },
];

export const DEFAULT_PRIME_COLUMNS: ChartColumn[] = [
  {
    key: "prime-ultrawide",
    label: "Ultrawide ≤16mm",
    group: "prime",
    order: 1,
  },
  { key: "prime-24", label: "24mm", group: "prime", order: 2 },
  { key: "prime-35", label: "35mm", group: "prime", order: 3 },
  { key: "prime-50", label: "50mm", group: "prime", order: 4 },
  { key: "prime-85", label: "85mm", group: "prime", order: 5 },
  {
    key: "prime-short-telephoto",
    label: "Short Tele (100–200)",
    group: "prime",
    order: 6,
  },
  {
    key: "prime-telephoto",
    label: "Telephoto (300–400)",
    group: "prime",
    order: 7,
  },
  { key: "prime-600", label: "600mm", group: "prime", order: 8 },
  { key: "prime-800", label: "800mm", group: "prime", order: 9 },
];

export function mergeDefaultColumns(custom: ChartColumn[] | undefined): {
  zoom: ChartColumn[];
  prime: ChartColumn[];
} {
  const extras = Array.isArray(custom) ? custom : [];

  const merge = (defaults: ChartColumn[], group: "prime" | "zoom") => {
    const map = new Map<string, ChartColumn>();
    for (const d of defaults) map.set(d.key, d);
    for (const c of extras.filter((e) => e.group === group)) {
      if (!map.has(c.key)) map.set(c.key, c);
    }
    const arr = Array.from(map.values());
    arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return arr;
  };

  return {
    zoom: merge(DEFAULT_ZOOM_COLUMNS, "zoom"),
    prime: merge(DEFAULT_PRIME_COLUMNS, "prime"),
  };
}
