import { type Metadata } from "next";
import { CompareClient } from "~/components/compare/compare-client";
import { CompareEmptyState } from "~/components/compare/compare-empty-state";
import { ComparePairTracker } from "./_components/compare-pair-tracker";
import { CompareReplaceButton } from "~/components/compare/compare-replace-button";
import { CompareLoadingOverlayProvider } from "~/components/compare/compare-loading-overlay";
import { fetchGearBySlug } from "~/server/gear/service";
import { getBrandNameById, stripLeadingBrand } from "~/lib/mapping/brand-map";
import { CompareHeroScaledRow } from "~/components/compare/compare-hero-scaled";
import { cn } from "~/lib/utils";

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
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const raw of values) {
    const slug = raw?.trim();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    ordered.push(slug);
    if (ordered.length === 2) break;
  }
  return ordered;
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
    return (
      <CompareLoadingOverlayProvider>
        <CompareEmptyState />
      </CompareLoadingOverlayProvider>
    );
  }

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
    <CompareLoadingOverlayProvider>
      <div className="mx-auto mt-24 min-h-screen max-w-6xl space-y-0 px-4 py-8">
        <section className="space-y-6">
          <div className="grid grid-cols-2 gap-8 text-4xl font-semibold md:text-5xl">
            <div className="flex flex-col items-end text-right">
              <p className="text-muted-foreground text-sm tracking-wide uppercase">
                {aBrand || "Unknown brand"}
              </p>
              <div className="flex w-full items-center justify-between gap-5">
                <CompareReplaceButton slug={slugA} fallbackIndex={0} />
                <p className="leading-tight">{aName || slugA}</p>
              </div>
            </div>
            <div className="flex flex-col items-start text-left">
              <p className="text-muted-foreground text-sm tracking-wide uppercase">
                {bBrand || "Unknown brand"}
              </p>
              <div className="flex w-full items-center justify-between gap-5">
                <p className="leading-tight">{bName || slugB}</p>
                <CompareReplaceButton slug={slugB} fallbackIndex={1} />
              </div>
            </div>
          </div>
          <div className="space-y-0">
            <CompareHeroScaledRow leftItem={a} rightItem={b} />
          </div>
        </section>

        <section
          className={cn(
            "bg-background border-border border-t-2 py-8 shadow-sm",
            a?.gearType === "CAMERA" && b?.gearType === "CAMERA" && "-mt-20",
          )}
        >
          {/* Increment pair counter once per page load when both sides resolve */}
          {a && b ? <ComparePairTracker slugs={pair} /> : null}

          <CompareClient slugs={pair} a={a} b={b} />
        </section>
      </div>
    </CompareLoadingOverlayProvider>
  );
}
