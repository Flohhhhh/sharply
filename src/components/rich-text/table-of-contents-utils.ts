export type HeadingPosition = {
  id: string;
  top: number;
};

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
