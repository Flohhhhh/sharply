export type ColumnBucketingConfig = {
  // Zoom logic
  superzoomRangeThresholdMm: number; // e.g., 90
  superteleMinThresholdMm: number; // e.g., 100
  ultraWideMaxMm: number; // e.g., 14
  wideMaxMm: number; // e.g., 24
  standardMaxMm: number; // e.g., 70
  shortTeleMaxMm: number; // e.g., 300

  // Prime logic: nearest named focal bins
  primeNamedBinsMm: number[]; // e.g., [24, 35, 50, 85, 100, 135]
};

export const DEFAULT_BUCKETING_CONFIG: ColumnBucketingConfig = {
  superzoomRangeThresholdMm: 90,
  superteleMinThresholdMm: 100,
  ultraWideMaxMm: 14,
  wideMaxMm: 24,
  standardMaxMm: 70,
  shortTeleMaxMm: 300,
  primeNamedBinsMm: [24, 35, 50, 85, 100, 135],
};

export type ItemLensSpecs = {
  lensIsPrime: boolean | null;
  focalMin: number | null;
  focalMax: number | null;
};

// Returns a column key from DEFAULT_[PRIME/ZOOM]_COLUMNS
// Keys used: zoom-ultrawide | zoom-wide | zoom-standard | zoom-telephoto | zoom-supertelephoto | zoom-superzoom
//            prime-ultrawide | prime-24 | prime-35 | prime-50 | prime-85 | prime-telephoto | prime-short-telephoto
export function computeColumnKeyFromLensSpecs(
  specs: ItemLensSpecs,
  config: ColumnBucketingConfig = DEFAULT_BUCKETING_CONFIG,
): { group: "prime" | "zoom"; key: string } | null {
  const isPrime = !!specs.lensIsPrime;
  const focalMin = specs.focalMin ?? null;
  const focalMax = specs.focalMax ?? null;

  if (isPrime) {
    const f = focalMin ?? focalMax; // best-effort
    if (!f) return null;
    if (f < config.ultraWideMaxMm) {
      return { group: "prime", key: "prime-ultrawide" };
    }
    // Choose nearest named prime bin
    const bins = config.primeNamedBinsMm.length
      ? config.primeNamedBinsMm
      : [24, 35, 50, 85, 100, 135];
    let nearest = bins[0]!;
    let minDelta = Math.abs(f - nearest);
    for (const bin of bins) {
      const d = Math.abs(f - bin);
      if (d < minDelta) {
        nearest = bin;
        minDelta = d;
      }
    }
    // If focal length is way beyond last bin, treat as telephoto
    const last = bins[bins.length - 1]!;
    if (f > last + 20) {
      return { group: "prime", key: "prime-telephoto" };
    }
    if (nearest >= 100) {
      // Fold 100/135 into short tele bucket
      return { group: "prime", key: "prime-short-telephoto" };
    }
    return { group: "prime", key: `prime-${nearest}` };
  }

  // Zooms
  if (focalMin == null || focalMax == null) return null;
  const range = focalMax - focalMin;
  if (range > config.superzoomRangeThresholdMm) {
    if (focalMin > config.superteleMinThresholdMm)
      return { group: "zoom", key: "zoom-supertelephoto" };
    return { group: "zoom", key: "zoom-superzoom" };
  }

  if (focalMin < config.ultraWideMaxMm)
    return { group: "zoom", key: "zoom-ultrawide" };
  if (focalMin < config.wideMaxMm) return { group: "zoom", key: "zoom-wide" };
  if (focalMin < config.standardMaxMm)
    return { group: "zoom", key: "zoom-standard" };
  if (focalMin < config.shortTeleMaxMm)
    return { group: "zoom", key: "zoom-telephoto" };
  return { group: "zoom", key: "zoom-supertelephoto" };
}

// ----- Default Columns + Merge (consolidated here) -----
export type ChartColumn = {
  key: string;
  label: string;
  group: "prime" | "zoom";
  order?: number;
};

const DEFAULT_LABELS: Record<string, string> = {
  "zoom-ultrawide": "Ultrawide",
  "zoom-wide": "Wide",
  "zoom-standard": "Standard",
  "zoom-telephoto": "Telephoto",
  "zoom-supertelephoto": "Supertelephoto",
  "zoom-superzoom": "Superzoom",
  "prime-ultrawide": "Ultrawide",
  "prime-24": "24mm",
  "prime-35": "35mm",
  "prime-50": "50mm",
  "prime-85": "85mm",
  "prime-short-telephoto": "Short Telephoto",
  "prime-telephoto": "Telephoto",
  "prime-600": "600mm",
  "prime-800": "800mm",
};

function buildDefaultColumns(): { zoom: ChartColumn[]; prime: ChartColumn[] } {
  const orderedEntries = Object.entries(DEFAULT_LABELS);
  const cols: ChartColumn[] = orderedEntries.map(([key, label], idx) => ({
    key,
    label,
    group: key.startsWith("zoom-") ? "zoom" : "prime",
    order: idx,
  }));
  return {
    zoom: cols.filter((c) => c.group === "zoom"),
    prime: cols.filter((c) => c.group === "prime"),
  };
}

export function mergeDefaultColumns(custom: ChartColumn[] | undefined): {
  zoom: ChartColumn[];
  prime: ChartColumn[];
} {
  const extras = Array.isArray(custom) ? custom : [];
  const defaults = buildDefaultColumns();

  const merge = (base: ChartColumn[], group: "prime" | "zoom") => {
    const map = new Map<string, ChartColumn>();
    for (const d of base) map.set(d.key, d);
    for (const c of extras.filter((e) => e.group === group)) {
      if (!map.has(c.key)) map.set(c.key, c);
    }
    const arr = Array.from(map.values());
    arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return arr;
  };

  return {
    zoom: merge(defaults.zoom, "zoom"),
    prime: merge(defaults.prime, "prime"),
  };
}
