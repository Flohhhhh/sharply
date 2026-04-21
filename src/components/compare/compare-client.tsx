"use client";

import Link from "next/link";
import { CompareSpecsTable } from "~/components/compare/compare-specs-table";
import { useGearDisplayName } from "~/lib/hooks/useGearDisplayName";
import { useIsMobile } from "~/lib/hooks/useIsMobile";
import type { GearItem } from "~/types/gear";

export function CompareClient({
  slugs,
  a,
  b,
}: {
  slugs: string[];
  a?: GearItem | null;
  b?: GearItem | null;
}) {
  const isMobile = useIsMobile();
  const leftName = useGearDisplayName({
    name: a?.name ?? slugs[0] ?? "Gear item",
    regionalAliases: a?.regionalAliases ?? null,
  });
  const rightName = useGearDisplayName({
    name: b?.name ?? slugs[1] ?? "Gear item",
    regionalAliases: b?.regionalAliases ?? null,
  });

  console.log("[CompareClient] gear items", a, b);

  if (isMobile || !a || !b) {
    const compareItems = [
      slugs[0]
        ? { slug: slugs[0], displayName: leftName }
        : null,
      slugs[1]
        ? { slug: slugs[1], displayName: rightName }
        : null,
    ].filter((item): item is { slug: string; displayName: string } => Boolean(item));

    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {compareItems.map(({ slug, displayName }) => (
          <div key={slug} className="rounded-lg border p-4">
            <Link
              href={`/gear/${slug}`}
              className="mb-2 block text-lg font-medium hover:underline"
            >
              {displayName}
            </Link>
            <Link
              href={`/gear/${slug}`}
              className="text-primary text-sm hover:underline"
            >
              View gear page
            </Link>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-6">
      <CompareSpecsTable a={a} b={b} />
    </div>
  );
}
