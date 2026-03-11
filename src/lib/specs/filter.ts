import type { SpecsTableSection } from "~/app/(app)/(pages)/gear/_components/specs-table";

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function matchesRow(
  row: SpecsTableSection["data"][number],
  normalizedQuery: string,
): boolean {
  if (row.label.toLowerCase().includes(normalizedQuery)) {
    return true;
  }

  return (row.searchTerms ?? []).some((term) =>
    term.toLowerCase().includes(normalizedQuery),
  );
}

export function filterSpecsSections(
  sections: SpecsTableSection[],
  query: string,
): SpecsTableSection[] {
  const normalizedQuery = normalizeQuery(query);

  if (!normalizedQuery) {
    return sections;
  }

  return sections.flatMap((section) => {
    if (section.title.toLowerCase().includes(normalizedQuery)) {
      return [section];
    }

    const filteredRows = section.data.filter((row) =>
      matchesRow(row, normalizedQuery),
    );

    if (filteredRows.length === 0) {
      return [];
    }

    return [{ ...section, data: filteredRows }];
  });
}
