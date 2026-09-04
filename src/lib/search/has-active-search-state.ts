const RESULT_AFFECTING_SEARCH_KEYS = new Set([
  "q",
  "sort",
  "brand",
  "mount",
  "gearType",
  "sensorFormat",
  "lensType",
  "analogCameraType",
  "priceMin",
  "priceMax",
  "megapixelsMin",
  "megapixelsMax",
  "focalIncludes",
  "widestFocalMax",
  "longestFocalMin",
  "fastestApertureMax",
  "isoMin",
  "isoMax",
  "hasAutofocus",
  "hasStabilization",
  "hasIbis",
  "hasWeatherSealing",
  "tag",
]);

type SearchParamsRecord = Record<string, string | string[] | undefined>;

export function hasActiveSearchState(params: SearchParamsRecord): boolean {
  return Object.entries(params).some(([key, value]) => {
    if (!RESULT_AFFECTING_SEARCH_KEYS.has(key)) return false;
    if (Array.isArray(value))
      return value.some((item) => item.trim().length > 0);
    return value?.trim().length ? true : false;
  });
}
