export type GearCategory = "cameras" | "lenses";

type Rule = {
  order?: string[]; // desired short_name order; others drop or fall after
  hide?: string[]; // short_names to hide
};

export const mountUIConfig: Record<
  string,
  Partial<Record<GearCategory, Rule>>
> = {
  nikon: {
    lenses: { order: ["z", "f"], hide: ["nikon1", "s"] },
    cameras: { order: ["z", "f"], hide: ["nikon1", "s"] },
  },
  canon: {
    lenses: { order: ["rf", "ef", "efm"], hide: [] },
    cameras: { order: ["rf", "ef", "efm"], hide: [] },
  },
};
