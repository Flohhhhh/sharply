import Link from "next/link";
import { notFound } from "next/navigation";
import { type Metadata } from "next";
import { buildCompareHref } from "~/lib/utils/url";
import { CompareClient } from "~/components/compare/compare-client";
import { ComparePairTracker } from "./_components/compare-pair-tracker";
import { fetchGearBySlug } from "~/server/gear/service";
import { getBrandNameById, stripLeadingBrand } from "~/lib/mapping/brand-map";
import { OpenSearchButton } from "~/components/search/open-search-button";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const usp = new URLSearchParams();
  const raw = params.i; // string | string[] | undefined
  if (typeof raw === "string") usp.append("i", raw);
  else if (Array.isArray(raw)) for (const v of raw) usp.append("i", v);
  const pair = getPairFromParams(usp);
  if (pair.length === 0) {
    return { title: "Compare Gear" };
  }

  const [slugA, slugB] = pair;
  const [a, b] = await Promise.all([
    slugA ? fetchGearBySlug(slugA).catch(() => null) : null,
    slugB ? fetchGearBySlug(slugB).catch(() => null) : null,
  ]);

  const nameA = a?.name ?? slugA ?? "";
  const nameB = b?.name ?? slugB ?? "";

  return {
    title:
      pair.length === 1 ? `Compare ${nameA}` : `Compare ${nameA} vs ${nameB}`,
    openGraph: {
      title:
        pair.length === 1 ? `Compare ${nameA}` : `Compare ${nameA} vs ${nameB}`,
    },
  };
}

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
  const raw = params.i; // string | string[] | undefined
  if (typeof raw === "string") usp.append("i", raw);
  else if (Array.isArray(raw)) for (const v of raw) usp.append("i", v);

  const pair = getPairFromParams(usp);
  if (pair.length === 0) {
    // Guided empty state
    return (
      <div className="mx-auto min-h-screen max-w-5xl px-4 py-16 text-center">
        <h1 className="mt-32 mb-3 text-3xl font-semibold md:text-4xl">
          Nothing to compare yet
        </h1>
        <p className="text-muted-foreground mx-auto max-w-xl text-sm md:text-base">
          Search for 2 items and add them to the comparison to see how they
          stack up.
        </p>
        <div className="mt-6 flex items-center justify-center">
          <OpenSearchButton>Open search</OpenSearchButton>
        </div>
      </div>
    );
  }

  const href = buildCompareHref(pair);
  const [slugA, slugB] = pair;
  const [a, b] = await Promise.all([
    slugA ? fetchGearBySlug(slugA).catch(() => null) : null,
    slugB ? fetchGearBySlug(slugB).catch(() => null) : null,
  ]);

  const aBrand = (getBrandNameById(a?.brandId ?? "") ?? "").trim();
  const bBrand = (getBrandNameById(b?.brandId ?? "") ?? "").trim();
  const aName = stripLeadingBrand(a?.name ?? slugA ?? "", aBrand);
  const bName = stripLeadingBrand(b?.name ?? slugB ?? "", bBrand);

  return (
    <div className="mx-auto mt-24 min-h-screen max-w-6xl space-y-8 px-4 py-8">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4">
        <h2 className="text-left text-4xl">
          <span className="font-bold">{aBrand}</span> {aName}
        </h2>
        <span className="text-center">vs</span>
        <h2 className="text-right text-4xl">
          <span className="font-bold">{bBrand}</span> {bName}
        </h2>
      </div>

      {/* TODO: add a copy link or share button */}

      {/* Increment pair counter once per page load when both sides resolve */}
      {a && b ? <ComparePairTracker slugs={pair} /> : null}

      <CompareClient slugs={pair} a={a} b={b} />
    </div>
  );
}
