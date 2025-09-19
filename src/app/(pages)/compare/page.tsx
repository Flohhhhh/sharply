import Link from "next/link";
import { notFound } from "next/navigation";
import { type Metadata } from "next";
import { buildCompareHref } from "~/lib/utils/url";
import { CompareClient } from "~/components/compare/compare-client";
import { fetchGearBySlug } from "~/server/gear/service";

export const metadata: Metadata = {
  title: "Compare | Sharply",
};

function getPairFromParams(searchParams: URLSearchParams): string[] {
  const values = searchParams.getAll("i");
  const slugs = Array.from(new Set(values.filter(Boolean)));
  return slugs.slice(0, 2).sort((a, b) => a.localeCompare(b));
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const usp = new URLSearchParams();
  const raw = params["i"]; // string | string[] | undefined
  if (typeof raw === "string") usp.append("i", raw);
  else if (Array.isArray(raw)) for (const v of raw) usp.append("i", v);

  const pair = getPairFromParams(usp);
  if (pair.length === 0) {
    // Empty state
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-semibold">Compare</h1>
        <p className="text-muted-foreground">
          Add two items from anywhere using the button, then come back here to
          see the comparison.
        </p>
      </div>
    );
  }

  const href = buildCompareHref(pair);
  const [slugA, slugB] = pair;
  const [a, b] = await Promise.all([
    slugA ? fetchGearBySlug(slugA).catch(() => null) : null,
    slugB ? fetchGearBySlug(slugB).catch(() => null) : null,
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Compare</h1>
        <span className="text-muted-foreground text-sm">{href}</span>
      </div>

      <CompareClient slugs={pair} a={a as any} b={b as any} />
    </div>
  );
}
