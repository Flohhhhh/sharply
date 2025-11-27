export type BitDepthBucket = {
  label: string;
  min: number;
  max: number;
  className: string;
  iconTone: "light" | "dark";
};

export const BIT_DEPTH_BUCKETS: BitDepthBucket[] = [
  {
    label: "8-bit",
    min: 0,
    max: 8,
    className: "bg-zinc-500/50 text-white",
    iconTone: "dark",
  },
  {
    label: "10-bit",
    min: 9,
    max: 10,
    className: "bg-emerald-600/70 text-white",
    iconTone: "light",
  },
  {
    label: "12-bit+",
    min: 11,
    max: Infinity,
    className: "bg-blue-500/70 text-white",
    iconTone: "light",
  },
];

function findBucket(bitDepth?: number | null): BitDepthBucket | undefined {
  if (bitDepth == null || Number.isNaN(bitDepth)) return undefined;
  return BIT_DEPTH_BUCKETS.find(
    (bucket) => bitDepth >= bucket.min && bitDepth <= bucket.max,
  );
}

export function bitDepthClass(bitDepth?: number | null) {
  const bucket = findBucket(bitDepth);
  return bucket ? bucket.className : "bg-muted text-muted-foreground";
}

export function bitDepthIconTone(bitDepth?: number | null) {
  const bucket = findBucket(bitDepth);
  if (!bucket) return "text-slate-900/70";
  return bucket.iconTone === "dark" ? "text-slate-900/70" : "text-white/80";
}
