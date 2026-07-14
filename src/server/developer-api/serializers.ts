if (process.env.NEXT_RUNTIME) {
  import("server-only").catch(() => undefined);
}

import type { SearchResponse } from "~/types/search-results";
import type { Suggestion } from "~/types/search";
import type { GearItem } from "~/types/gear";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const DEVELOPER_API_GEAR_METADATA_KEYS = new Set([
  "id",
  "createdAt",
  "updatedAt",
]);

function serializeJsonWithOmittedKeys(
  value: unknown,
  omittedKeys?: ReadonlySet<string>,
): JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value.map((item) => serializeJsonWithOmittedKeys(item, omittedKeys));
  }
  if (typeof value === "object") {
    const serialized: Record<string, JsonValue> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      if (nestedValue === undefined || omittedKeys?.has(key)) continue;
      serialized[key] = serializeJsonWithOmittedKeys(nestedValue, omittedKeys);
    }
    return serialized;
  }
  if (typeof value === "bigint") return value.toString();
  return null;
}

/** Convert database values to a JSON-only public API representation. */
export function serializeJson(value: unknown): JsonValue {
  return serializeJsonWithOmittedKeys(value);
}

export function serializeSearchResponse(result: SearchResponse) {
  return {
    data: result.results.map((item) => ({
      slug: item.slug,
      name: item.name,
      brandName: item.brandName,
      gearType: item.gearType,
      thumbnailUrl: item.thumbnailUrl,
      releaseDate: item.releaseDate ? serializeJson(item.releaseDate) : null,
      releaseDatePrecision: item.releaseDatePrecision ?? null,
      announcedDate: item.announcedDate
        ? serializeJson(item.announcedDate)
        : null,
      announceDatePrecision: item.announceDatePrecision ?? null,
      msrpNowUsdCents: item.msrpNowUsdCents ?? null,
      msrpAtLaunchUsdCents: item.msrpAtLaunchUsdCents ?? null,
      mpbMaxPriceUsdCents: item.mpbMaxPriceUsdCents ?? null,
      regionalAliases: serializeJson(item.regionalAliases ?? []),
    })),
    pagination: {
      page: result.page,
      limit: result.pageSize,
      total: result.total ?? 0,
      totalPages: result.totalPages ?? 0,
    },
  };
}

export function serializeSuggestions(suggestions: Suggestion[]) {
  const data: Array<
    | { kind: "brand"; slug: string; name: string }
    | {
        kind: "gear";
        slug: string;
        name: string;
        canonicalName: string;
        matchedName: string;
        matchSource: string;
        isBestMatch: boolean;
        brandName: string | null;
        gearType: string;
      }
  > = [];

  for (const suggestion of suggestions) {
    if (suggestion.kind === "smart-action") continue;
    if (suggestion.kind === "brand") {
      data.push({
        kind: "brand",
        slug: suggestion.href.replace("/brand/", ""),
        name: suggestion.brandName,
      });
      continue;
    }

    data.push({
      kind: "gear",
      slug: suggestion.href.replace("/gear/", ""),
      name: suggestion.localizedName,
      canonicalName: suggestion.canonicalName,
      matchedName: suggestion.matchedName,
      matchSource: suggestion.matchSource,
      isBestMatch: suggestion.isBestMatch,
      brandName: suggestion.brandName,
      gearType: suggestion.gearType,
    });
  }

  return {
    data,
  };
}

export function serializeGear(item: GearItem) {
  const publicGear: Record<string, unknown> = { ...item };
  // These relation fields are not part of the current beta contract.
  delete publicGear.brandId;
  delete publicGear.mountId;
  delete publicGear.searchName;
  // Full video-mode matrices are intentionally not part of the beta contract.
  // Consumers can still use the published video capability specs selectively.
  delete publicGear.videoModes;
  if (item.rawSamples) {
    publicGear.rawSamples = item.rawSamples.map((sample) => {
      const publicSample: Record<string, unknown> = { ...sample };
      delete publicSample.uploadedByUserId;
      delete publicSample.isDeleted;
      delete publicSample.deletedAt;
      return publicSample;
    });
  }
  return {
    data: serializeJsonWithOmittedKeys(
      publicGear,
      DEVELOPER_API_GEAR_METADATA_KEYS,
    ),
  };
}

export function serializeDeveloperApiSpecs(
  specs: Array<{ id: string; raw: unknown; display: string }>,
) {
  return {
    data: specs.map((spec) => ({
      id: spec.id,
      raw: serializeJson(spec.raw),
      display: spec.display,
    })),
  };
}
