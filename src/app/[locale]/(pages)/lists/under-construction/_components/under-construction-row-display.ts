export function splitBrandPrefix(
  name: string,
  brandName: string | null,
): {
  brandPrefix: string | null;
  modelName: string;
} {
  const normalizedBrand = brandName?.trim();
  if (!normalizedBrand) {
    return { brandPrefix: null, modelName: name };
  }

  const possiblePrefix = name.slice(0, normalizedBrand.length);
  const boundary = name.at(normalizedBrand.length);
  const matchesBrand =
    possiblePrefix.toLocaleLowerCase() === normalizedBrand.toLocaleLowerCase();
  const hasValidBoundary = boundary === undefined || /\s/u.test(boundary);

  if (!matchesBrand || !hasValidBoundary) {
    return { brandPrefix: null, modelName: name };
  }

  return {
    brandPrefix: possiblePrefix,
    modelName: name.slice(normalizedBrand.length).trimStart(),
  };
}
