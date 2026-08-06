type SearchableTag = {
  name: string;
  slug: string;
  description: string | null;
  pageTitle: string | null;
  pageContent: string | null;
};

export function filterTagDictionary<T extends SearchableTag>(
  tags: T[],
  query: string,
): T[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return tags;

  return tags.filter((tag) =>
    [tag.name, tag.slug, tag.description, tag.pageTitle, tag.pageContent]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLocaleLowerCase().includes(normalizedQuery)),
  );
}
