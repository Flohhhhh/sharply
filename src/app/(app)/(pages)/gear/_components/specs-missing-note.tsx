import type { GearItem } from "~/types/gear";
import { getConstructionState } from "~/lib/utils";
import { SuggestEditButton } from "./suggest-edit-button";

function isUnfilled(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function countMissingValues(
  obj: Record<string, unknown> | null | undefined,
  excludeKeys: string[] = [],
): number {
  if (!obj) return 0;
  let count = 0;
  for (const [key, value] of Object.entries(obj)) {
    if (excludeKeys.includes(key)) continue;
    if (isUnfilled(value)) count += 1;
  }
  return count;
}

function countMissingForItem(item: GearItem): number {
  const coreMissingCount = getConstructionState(item).missing.length;

  let extra = 0;

  if (!item.releaseDate) extra += 1;

  const baseExcludes = ["id", "gearId", "createdAt", "updatedAt"];

  if (item.gearType === "CAMERA") {
    const cameraExcludes = [
      ...baseExcludes,
      "sensorFormatId",
      "resolutionMp",
      "afAreaModes",
    ];
    extra += countMissingValues(item.cameraSpecs as any, cameraExcludes);
  } else if (item.gearType === "LENS") {
    const lensExcludes = [
      ...baseExcludes,
      "focalLengthMinMm",
      "focalLengthMaxMm",
      "maxAperture",
    ];
    extra += countMissingValues(item.lensSpecs as any, lensExcludes);
  }

  return coreMissingCount + extra;
}

export function SpecsMissingNote({ item }: { item: GearItem }) {
  const missingCount = countMissingForItem(item);
  if (missingCount <= 0) return null;

  return (
    <div className="space-x-2 border-t px-4 py-3 text-sm">
      <span className="text-muted-foreground">
        {missingCount} {missingCount === 1 ? "item" : "items"} missing.
      </span>
      <span>
        <SuggestEditButton
          slug={item.slug}
          gearType={item.gearType as any}
          variant="link"
          label="Contribute missing data."
          searchParams={{ showMissingOnly: true }}
          compact
        />
      </span>
    </div>
  );
}
