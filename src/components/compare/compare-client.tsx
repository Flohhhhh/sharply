"use client";

import Link from "next/link";
import type { GearItem } from "~/types/gear";
import { useIsMobile } from "~/lib/hooks/useIsMobile";
import { CompareSpecsTable } from "~/components/compare/compare-specs-table";

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

  console.log("[CompareClient] gear items", a, b);

  if (isMobile || !a || !b) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {slugs.map((slug) => (
          <div key={slug} className="rounded-lg border p-4">
            <div className="mb-2 truncate text-lg font-medium">{slug}</div>
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
