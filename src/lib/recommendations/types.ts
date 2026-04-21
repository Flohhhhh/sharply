export type Rating =
  | "best value"
  | "best performance"
  | "situational"
  | "balanced";

export interface ChartItem {
  name: string;
  rating: Rating;
  note?: string;
  group?: "prime" | "zoom"; // grouping for grid
  column?: string; // manual category key within group
  priceLow?: number; // used for sorting ascending
  priceHigh?: number;
  priceDisplay?: string; // optional preformatted price text
}

export interface ChartColumn {
  key: string; // unique identifier used by items via `column`
  label: string; // human-readable label shown in the UI
  group: "prime" | "zoom"; // which half of the grid this column belongs to
  order?: number; // optional sort order for columns
}

export interface Chart {
  brand: string;
  slug: string;
  title: string;
  updatedAt: string; // ISO date string
  items: ChartItem[];
  columns?: ChartColumn[]; // optional manually defined columns
}

export function assertChart(input: unknown): Chart {
  const o = input as Record<string, unknown>;
  if (!o || typeof o !== "object") throw new Error("Invalid chart");
  const validRating = (r: unknown): r is Rating =>
    r === "best value" ||
    r === "best performance" ||
    r === "situational" ||
    r === "balanced";
  if (
    typeof o.brand !== "string" ||
    typeof o.slug !== "string" ||
    typeof o.title !== "string" ||
    typeof o.updatedAt !== "string" ||
    !Array.isArray(o.items)
  )
    throw new Error("Invalid chart");
  const items = o.items.map((i) => {
    const it = i as Record<string, unknown>;
    if (typeof it.name !== "string" || !validRating(it.rating))
      throw new Error("Invalid chart item");
    return {
      name: it.name,
      rating: it.rating,
      note: typeof it.note === "string" ? it.note : undefined,
      group:
        it.group === "prime" || it.group === "zoom"
          ? (it.group)
          : undefined,
      column: typeof it.column === "string" ? (it.column) : undefined,
      priceLow:
        typeof it.priceLow === "number" ? (it.priceLow) : undefined,
      priceHigh:
        typeof it.priceHigh === "number" ? (it.priceHigh) : undefined,
      priceDisplay:
        typeof it.priceDisplay === "string"
          ? (it.priceDisplay)
          : undefined,
    };
  });
  // columns are optional and manually defined per chart
  const columns: ChartColumn[] | undefined = Array.isArray((o as any).columns)
    ? ((o as any).columns as unknown[])
        .map((c) => c as Record<string, unknown>)
        .filter(
          (c) =>
            typeof c.key === "string" &&
            typeof c.label === "string" &&
            (c.group === "prime" || c.group === "zoom"),
        )
        .map((c) => ({
          key: c.key as string,
          label: c.label as string,
          group: c.group as "prime" | "zoom",
          order: typeof c.order === "number" ? (c.order) : undefined,
        }))
    : undefined;

  return {
    brand: o.brand,
    slug: o.slug,
    title: o.title,
    updatedAt: o.updatedAt,
    items,
    columns,
  } as Chart;
}
