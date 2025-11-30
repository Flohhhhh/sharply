"use client";

import type { GearItem } from "~/types/gear";
import { buildGearSpecsSections, specDictionary } from "~/lib/specs/registry";
import { cn } from "~/lib/utils";
import { Fragment, useState } from "react";
import { SuggestEditButton } from "~/app/(app)/(pages)/gear/_components/suggest-edit-button";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { getConstructionState } from "~/lib/utils";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

type Row = { label: string; a?: React.ReactNode; b?: React.ReactNode };
type SpecsSection = ReturnType<typeof buildGearSpecsSections>[number];

const sectionLabelOrder = new Map(
  specDictionary.map((section) => [
    section.title,
    section.fields
      .filter((field) => Boolean(field.label))
      .map((field) => field.label as string),
  ]),
);

function filterEmptyRows(rows: Row[]): Row[] {
  // Only keep rows where BOTH items have a value
  return rows.filter((r) => r.a != null && r.b != null);
}

function buildAlignedRows(
  title: string,
  aSection?: SpecsSection,
  bSection?: SpecsSection,
): Row[] {
  const labelOrder = sectionLabelOrder.get(title) ?? [];
  const rowsByLabel = new Map<string, Row>();

  const addValue = (
    label: string | undefined,
    key: "a" | "b",
    value?: React.ReactNode,
  ) => {
    if (!label) return;
    const existing = rowsByLabel.get(label) ?? { label };
    existing[key] = value;
    rowsByLabel.set(label, existing);
  };

  for (const row of aSection?.data ?? []) addValue(row.label, "a", row.value);
  for (const row of bSection?.data ?? []) addValue(row.label, "b", row.value);

  const orderedRows: Row[] = [];
  const seen = new Set<string>();

  for (const label of labelOrder) {
    const entry = rowsByLabel.get(label);
    if (entry) {
      orderedRows.push(entry);
      seen.add(label);
    }
  }

  for (const [label, entry] of rowsByLabel.entries()) {
    if (!seen.has(label)) {
      orderedRows.push(entry);
    }
  }

  return orderedRows;
}

function countMissingSpecs(
  sections: ReturnType<typeof buildGearSpecsSections>,
) {
  let missing = 0;
  for (const s of sections) {
    for (const d of s.data) {
      if (d?.value == null) missing++;
    }
  }
  return missing;
}

export function CompareSpecsTable({
  a,
  b,
  className,
}: {
  a: GearItem;
  b: GearItem;
  className?: string;
}) {
  const aSections = buildGearSpecsSections(a, true);
  const bSections = buildGearSpecsSections(b, true);
  const missingA = countMissingSpecs(aSections);
  const missingB = countMissingSpecs(bSections);
  const { status } = useSession();
  const aConstruction = getConstructionState(a);
  const bConstruction = getConstructionState(b);
  const [showMissing, setShowMissing] = useState(false);

  // Align sections by title (assumes same registry for both types)
  const byTitle = new Map<string, { a?: SpecsSection; b?: SpecsSection }>();
  for (const s of aSections) byTitle.set(s.title, { a: s });
  for (const s of bSections)
    byTitle.set(s.title, { ...(byTitle.get(s.title) || {}), b: s });

  const sections = Array.from(byTitle.keys()).map((title) => {
    const sa = byTitle.get(title)?.a;
    const sb = byTitle.get(title)?.b;
    const rows = buildAlignedRows(title, sa, sb);
    return {
      title,
      rows,
      rowsWithBoth: filterEmptyRows(rows),
    };
  });

  const totalRowsAny = sections.reduce(
    (acc, section) => acc + section.rows.length,
    0,
  );
  const totalRowsWithBoth = sections.reduce(
    (acc, section) => acc + section.rowsWithBoth.length,
    0,
  );
  const hiddenRowCount = totalRowsAny - totalRowsWithBoth;

  if (
    totalRowsAny === 0 ||
    aConstruction.underConstruction ||
    bConstruction.underConstruction
  ) {
    return (
      <div className={cn("rounded-md border p-6 text-center", className)}>
        <p className="text-muted-foreground text-sm">
          We don't have enough information on these gear items to show a
          comparison yet.
        </p>
        {status !== "authenticated" ? (
          <div className="bg-muted/40 mt-4 rounded-md border p-4 text-left">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <div className="font-medium">Log in to contribute</div>
                <div className="text-muted-foreground text-sm">
                  Help us fill in the missing specs to enable rich comparisons.
                </div>
              </div>
              <Button asChild>
                <Link href={`/api/auth/signin`}>Log in to contribute</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border p-3 text-left">
              <div className="font-medium">{a.name}</div>
              <div className="text-muted-foreground text-sm">
                {missingA} specs missing
              </div>
              {aConstruction.underConstruction &&
              aConstruction.missing?.length ? (
                <ul className="text-muted-foreground mt-1 list-inside list-disc text-xs">
                  {aConstruction.missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-2">
                <SuggestEditButton slug={a.slug} gearType={a.gearType} />
              </div>
            </div>
            <div className="rounded-md border p-3 text-left">
              <div className="font-medium">{b.name}</div>
              <div className="text-muted-foreground text-sm">
                {missingB} specs missing
              </div>
              {bConstruction.underConstruction &&
              bConstruction.missing?.length ? (
                <ul className="text-muted-foreground mt-1 list-inside list-disc text-xs">
                  {bConstruction.missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-2">
                <SuggestEditButton slug={b.slug} gearType={b.gearType} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const hasRenderableRows = showMissing
    ? totalRowsAny > 0
    : totalRowsWithBoth > 0;

  return (
    <div
      className={cn(
        "bg-background overflow-hidden rounded-md shadow-sm",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 text-sm">
        <p className="text-muted-foreground">
          {showMissing
            ? "Showing all available specs, including rows with missing info."
            : hiddenRowCount > 0
              ? `Hiding ${hiddenRowCount} row${
                  hiddenRowCount === 1 ? "" : "s"
                } until both sides have data.`
              : "All visible rows have complete data."}
        </p>
        <label
          htmlFor="compare-show-missing"
          className="flex items-center gap-2 text-sm font-medium"
        >
          <Checkbox
            id="compare-show-missing"
            checked={showMissing}
            onCheckedChange={(checked) => setShowMissing(checked === true)}
          />
          Show rows with missing info
        </label>
      </div>
      {hasRenderableRows ? (
        <div className="space-y-6">
          {sections.map(({ title, rows, rowsWithBoth }) => {
            const rowsToRender = showMissing ? rows : rowsWithBoth;
            if (rowsToRender.length === 0) return null;
            return (
              <div key={title} className="overflow-hidden rounded-md border">
                <div className="text-muted-foreground px-4 py-3 text-2xl font-semibold">
                  {title}
                </div>
                <Table>
                  <colgroup>
                    <col className="w-1/3" />
                    <col className="w-1/3" />
                    <col className="w-1/3" />
                  </colgroup>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-muted-foreground px-4 py-3 text-xs tracking-wide uppercase">
                        Spec
                      </TableHead>
                      <TableHead className="text-muted-foreground px-4 py-3 text-xs tracking-wide uppercase">
                        {a.name}
                      </TableHead>
                      <TableHead className="text-muted-foreground px-4 py-3 text-xs tracking-wide uppercase">
                        {b.name}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rowsToRender.map((r, idx) => (
                      <TableRow key={`${title}-${idx}`} className="text-sm">
                        <TableCell className="text-muted-foreground px-4 py-3 align-top">
                          {r.label}
                        </TableCell>
                        <TableCell className="px-4 py-3 align-top">
                          {r.a ?? "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3 align-top">
                          {r.b ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-muted-foreground px-4 py-6 text-center text-sm">
          No overlapping specs yet. Enable “Show rows with missing info” to see
          what we have so far.
        </div>
      )}
    </div>
  );
}
