export type HeadingPosition = {
  id: string;
  top: number;
};

export function createUniqueHeadingId(
  text: string,
  index: number,
  usedIds: Set<string>,
) {
  const slug = text
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/\s+/gu, "-")
    .replace(/[^\p{L}\p{M}\p{N}-]/gu, "")
    .replace(/^-+|-+$/gu, "");
  const baseId = slug || `heading-${index + 1}`;
  let id = baseId;
  let suffix = 2;

  while (usedIds.has(id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(id);
  return id;
}

export function getActiveHeadingId(
  headings: HeadingPosition[],
  readingLine: number,
  isAtPageEnd: boolean,
) {
  if (headings.length === 0) return "";
  if (isAtPageEnd) return headings.at(-1)?.id || "";

  let activeId = headings[0]?.id || "";

  for (const heading of headings) {
    if (heading.top > readingLine) break;
    activeId = heading.id;
  }

  return activeId;
}
