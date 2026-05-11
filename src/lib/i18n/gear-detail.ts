import type { TranslationValues } from "next-intl";

export type GearDetailTranslator = ((
  key: string,
  values?: TranslationValues,
) => string) & {
  has?: (key: string) => boolean;
};

type GenreSource = {
  id?: string;
  slug?: string;
  name?: string;
};

function interpolateFallback(
  fallback: string,
  values?: TranslationValues,
): string {
  if (!values) return fallback;

  return fallback.replaceAll(/\{(\w+)\}/g, (token, key: string) => {
    const value = values[key];

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "bigint" ||
      typeof value === "boolean"
    ) {
      return String(value);
    }

    return token;
  });
}

export function translateGearDetailWithFallback(
  t: GearDetailTranslator,
  key: string,
  fallback: string,
  values?: TranslationValues,
): string {
  if (!fallback) return fallback;
  if (typeof t.has === "function" && !t.has(key)) {
    return interpolateFallback(fallback, values);
  }

  try {
    return t(key, values);
  } catch {
    return interpolateFallback(fallback, values);
  }
}

export function getSpecSectionTitle(
  t: GearDetailTranslator,
  sectionId: string,
  fallback: string,
): string {
  return translateGearDetailWithFallback(
    t,
    `specRegistry.sections.${sectionId}.title`,
    fallback,
  );
}

export function getSpecFieldLabel(
  t: GearDetailTranslator,
  sectionId: string,
  fieldKey: string,
  fallback: string,
  variant: "label" | "labelPlural" = "label",
): string {
  return translateGearDetailWithFallback(
    t,
    `specRegistry.sections.${sectionId}.fields.${fieldKey}.${variant}`,
    fallback,
  );
}

export function getReviewGenreLabel(
  t: GearDetailTranslator,
  locale: string,
  genre: GenreSource,
): string {
  const slug = genre.slug ?? genre.id ?? "";
  const fallback = genre.name ?? slug;

  if (!slug || !fallback) return fallback;
  if (locale === "en") return fallback;

  return translateGearDetailWithFallback(
    t,
    `reviewGenres.${slug}`,
    fallback,
  );
}
