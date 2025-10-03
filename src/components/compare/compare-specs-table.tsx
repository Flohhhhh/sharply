"use client";

import type { GearItem } from "~/types/gear";
import { buildGearSpecsSections } from "~/lib/specs/registry";
import { cn } from "~/lib/utils";
import { Fragment } from "react";
import { SuggestEditButton } from "~/app/(app)/(pages)/gear/_components/suggest-edit-button";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { getConstructionState } from "~/lib/utils";

type Row = { label: string; a?: React.ReactNode; b?: React.ReactNode };

function filterEmptyRows(rows: Row[]): Row[] {
  // Only keep rows where BOTH items have a value
  return rows.filter((r) => r.a != null && r.b != null);
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
  const aSections = buildGearSpecsSections(a);
  const bSections = buildGearSpecsSections(b);
  const missingA = countMissingSpecs(aSections);
  const missingB = countMissingSpecs(bSections);
  const { status } = useSession();
  const aConstruction = getConstructionState(a);
  const bConstruction = getConstructionState(b);

  // Align sections by title (assumes same registry for both types)
  const byTitle = new Map<string, { a?: any; b?: any }>();
  for (const s of aSections) byTitle.set(s.title, { a: s });
  for (const s of bSections)
    byTitle.set(s.title, { ...(byTitle.get(s.title) || {}), b: s });

  const titles = Array.from(byTitle.keys());

  // Count total visible rows across all sections
  let totalVisibleRows = 0;
  for (const title of titles) {
    const sa = byTitle.get(title)?.a;
    const sb = byTitle.get(title)?.b;
    const rows: Row[] = [];
    const max = Math.max(sa?.data?.length ?? 0, sb?.data?.length ?? 0);
    for (let i = 0; i < max; i++) {
      const la = sa?.data?.[i];
      const lb = sb?.data?.[i];
      if (!la && !lb) continue;
      const label = la?.label ?? lb?.label ?? "";
      rows.push({ label, a: la?.value as any, b: lb?.value as any });
    }
    totalVisibleRows += filterEmptyRows(rows).length;
  }

  if (
    totalVisibleRows === 0 ||
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

  return (
    <div className={cn("rounded-md border", className)}>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-1/3" />
            <col className="w-1/3" />
            <col className="w-1/3" />
          </colgroup>
          <thead>
            <tr className="text-muted-foreground text-left text-xs uppercase">
              <th className="px-3 py-2">Spec</th>
              <th className="px-3 py-2">{a.name}</th>
              <th className="px-3 py-2">{b.name}</th>
            </tr>
          </thead>
          <tbody>
            {titles.map((title) => {
              const sa = byTitle.get(title)?.a;
              const sb = byTitle.get(title)?.b;
              const rows: Row[] = [];
              const max = Math.max(
                sa?.data?.length ?? 0,
                sb?.data?.length ?? 0,
              );
              for (let i = 0; i < max; i++) {
                const la = sa?.data?.[i];
                const lb = sb?.data?.[i];
                if (!la && !lb) continue;
                const label = la?.label ?? lb?.label ?? "";
                rows.push({ label, a: la?.value as any, b: lb?.value as any });
              }
              const filtered = filterEmptyRows(rows);
              if (filtered.length === 0) return null;
              return (
                <Fragment key={title}>
                  <tr className="bg-muted/40">
                    <td
                      colSpan={3}
                      className="px-3 py-2 text-xs font-semibold tracking-wide uppercase"
                    >
                      {title}
                    </td>
                  </tr>
                  {filtered.map((r, idx) => (
                    <tr key={`${title}-${idx}`} className="border-t">
                      <td className="text-muted-foreground px-3 py-2 align-top text-sm">
                        {r.label}
                      </td>
                      <td className="px-3 py-2 align-top text-sm">
                        {r.a ?? "—"}
                      </td>
                      <td className="px-3 py-2 align-top text-sm">
                        {r.b ?? "—"}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
