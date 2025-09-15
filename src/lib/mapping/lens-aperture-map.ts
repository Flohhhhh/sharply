/** Lens aperture formatting helpers */

function trimZeros(n: number | null | undefined): string {
  if (n == null) return "";
  return Number(n)
    .toFixed(2)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*[1-9])0+$/, "$1");
}

export function formatApertureSingle(n: number | null | undefined): string {
  const s = trimZeros(n);
  return s ? `f/${s}` : "";
}

export function formatApertureRange(
  wide: number | null | undefined,
  tele: number | null | undefined,
): string {
  const a = trimZeros(wide);
  const b = trimZeros(tele);
  if (!a && !b) return "";
  if (!b || a === b) return `f/${a}`;
  if (!a) return `f/${b}`;
  return `f/${a} - ${b}`;
}

export function formatLensApertureDisplay({
  maxApertureWide,
  maxApertureTele,
  minApertureWide,
  minApertureTele,
}: {
  maxApertureWide: number | null | undefined;
  maxApertureTele?: number | null | undefined;
  minApertureWide: number | null | undefined;
  minApertureTele?: number | null | undefined;
}): { maxText: string; minText: string } {
  return {
    maxText: formatApertureRange(maxApertureWide ?? null, maxApertureTele),
    minText: formatApertureRange(minApertureWide ?? null, minApertureTele),
  };
}
