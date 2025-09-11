/**
 * Format dimensions from width/height/depth in millimeters.
 * - Returns annotated parts (e.g., "Width 130mm × Height 98mm × Depth 69mm")
 * - Skips any null/undefined values
 * - If only one value present, uses full label ("Width", "Height", "Depth")
 * - If two or more present, uses short labels ("W", "H", "D") to keep compact
 */
export function formatDimensions(params: {
  widthMm?: number | null | undefined;
  heightMm?: number | null | undefined;
  depthMm?: number | null | undefined;
}): string | null {
  const { widthMm, heightMm, depthMm } = params;
  const parts: Array<{ key: "W" | "H" | "D"; full: string; value: number }> =
    [];
  if (typeof widthMm === "number")
    parts.push({ key: "W", full: "Width", value: widthMm });
  if (typeof heightMm === "number")
    parts.push({ key: "H", full: "Height", value: heightMm });
  if (typeof depthMm === "number")
    parts.push({ key: "D", full: "Depth", value: depthMm });

  if (parts.length === 0) return null;

  const useFull = parts.length === 1;
  return parts
    .map((p) => `${useFull ? p.full : p.key} ${formatNumber(p.value)}mm`)
    .join(" × ");
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return Number(n.toFixed(1)).toString();
}
