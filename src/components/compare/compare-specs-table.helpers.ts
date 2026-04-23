import type { SpecsTableSection } from "~/app/[locale]/(pages)/gear/_components/specs-table";
import { specDictionary } from "~/lib/specs/registry";

type CompareRow = {
  key: string;
  label: string;
  a?: React.ReactNode;
  b?: React.ReactNode;
};

const sectionOrderIndex = new Map(
  specDictionary.map((section, index) => [section.id, index]),
);

const sectionFieldOrder = new Map(
  specDictionary.map((section) => [
    section.id,
    section.fields
      .filter((field) => Boolean(field.label))
      .map((field) => field.key),
  ]),
);

function filterEmptyRows(rows: CompareRow[]): CompareRow[] {
  return rows.filter((row) => row.a != null && row.b != null);
}

function buildAlignedRows(
  sectionId: string,
  aSection?: SpecsTableSection,
  bSection?: SpecsTableSection,
): CompareRow[] {
  const fieldOrder = new Map(
    (sectionFieldOrder.get(sectionId) ?? []).map((fieldKey, index) => [
      fieldKey,
      index,
    ]),
  );
  const rowsByKey = new Map<string, CompareRow>();

  const addValue = (
    rowKey: string | undefined,
    label: string | undefined,
    side: "a" | "b",
    value?: React.ReactNode,
  ) => {
    if (!rowKey || !label) return;
    const existing = rowsByKey.get(rowKey) ?? { key: rowKey, label };
    existing.label = label;
    existing[side] = value;
    rowsByKey.set(rowKey, existing);
  };

  for (const row of aSection?.data ?? []) {
    addValue(row.key, row.label, "a", row.value);
  }
  for (const row of bSection?.data ?? []) {
    addValue(row.key, row.label, "b", row.value);
  }

  return Array.from(rowsByKey.values()).sort((left, right) => {
    const leftOrder = fieldOrder.get(left.key) ?? Number.POSITIVE_INFINITY;
    const rightOrder = fieldOrder.get(right.key) ?? Number.POSITIVE_INFINITY;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }
    return left.key.localeCompare(right.key);
  });
}

export function buildCompareSections(
  aSections: SpecsTableSection[],
  bSections: SpecsTableSection[],
) {
  const byId = new Map<string, { a?: SpecsTableSection; b?: SpecsTableSection }>();
  for (const section of aSections) byId.set(section.id, { a: section });
  for (const section of bSections) {
    byId.set(section.id, { ...(byId.get(section.id) || {}), b: section });
  }

  return Array.from(byId.entries())
    .sort(([leftId], [rightId]) => {
      const leftIndex = sectionOrderIndex.get(leftId) ?? Number.POSITIVE_INFINITY;
      const rightIndex = sectionOrderIndex.get(rightId) ?? Number.POSITIVE_INFINITY;

      // Both missing: use deterministic tie-breaker
      if (leftIndex === Number.POSITIVE_INFINITY && rightIndex === Number.POSITIVE_INFINITY) {
        return leftId.localeCompare(rightId);
      }

      return leftIndex - rightIndex;
    })
    .map(([sectionId, pair]) => {
      const rows = buildAlignedRows(sectionId, pair.a, pair.b);
      return {
        id: sectionId,
        title: pair.a?.title ?? pair.b?.title ?? sectionId,
        rows,
        rowsWithBoth: filterEmptyRows(rows),
      };
    });
}