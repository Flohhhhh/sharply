export function supportsViewfinderEyePoint(
  viewfinderType: string | null | undefined,
): boolean {
  return Boolean(viewfinderType && viewfinderType !== "none");
}

type ViewfinderEyePointFields = {
  viewfinderType?: string | null;
  viewfinderEyePointMm?: unknown;
};

export function normalizeViewfinderEyePointUpdate<
  T extends ViewfinderEyePointFields,
>(current: ViewfinderEyePointFields | null | undefined, update: T): T {
  const effectiveType = Object.hasOwn(update, "viewfinderType")
    ? update.viewfinderType
    : current?.viewfinderType;
  const effectiveEyePoint = Object.hasOwn(update, "viewfinderEyePointMm")
    ? update.viewfinderEyePointMm
    : current?.viewfinderEyePointMm;

  if (supportsViewfinderEyePoint(effectiveType) || effectiveEyePoint == null) {
    return update;
  }

  return { ...update, viewfinderEyePointMm: null };
}
