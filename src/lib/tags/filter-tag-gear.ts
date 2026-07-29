type SearchableTagGear = {
  name: string;
  slug: string;
  brandName: string | null;
};

export function filterTagGear<T extends SearchableTagGear>(
  gear: T[],
  query: string,
): T[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return gear;

  return gear.filter((item) =>
    [item.name, item.slug, item.brandName]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLocaleLowerCase().includes(normalizedQuery)),
  );
}
