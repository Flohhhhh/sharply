import { type Metadata } from "next";
import Image from "next/image";
import { CompareClient } from "~/components/compare/compare-client";
import { CompareEmptyState } from "~/components/compare/compare-empty-state";
import { ComparePairTracker } from "./_components/compare-pair-tracker";
import { CompareReplaceButton } from "~/components/compare/compare-replace-button";
import { CompareLoadingOverlayProvider } from "~/components/compare/compare-loading-overlay";
import { fetchGearBySlug } from "~/server/gear/service";
import { getBrandNameById, stripLeadingBrand } from "~/lib/mapping/brand-map";
import { cn } from "~/lib/utils";
import type { GearItem } from "~/types/gear";

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
          <div className="relative grid grid-cols-2 gap-4">
            <CompareHeroImage item={a} side="left" />
            <CompareHeroImage item={b} side="right" />
            <div className="pointer-events-none absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 sm:flex">
              <div className="bg-foreground text-background flex h-16 w-16 items-center justify-center rounded-full text-base font-semibold tracking-wide uppercase">
                vs
              </div>
            </div>
          </div>
        </div>
      </section>

        <section className="bg-background border-border -mt-20 border-t-2 py-8 shadow-sm">
          {/* Increment pair counter once per page load when both sides resolve */}
          {a && b ? <ComparePairTracker slugs={pair} /> : null}

          <CompareClient slugs={pair} a={a} b={b} />
        </section>
      </div>
    </CompareLoadingOverlayProvider>
  );
}

function CompareHeroImage({
  item,
  side,
}: {
  item: GearItem | null;
  side: "left" | "right";
}) {
  const hasImage = Boolean(item?.thumbnailUrl);
  const alignment =
    side === "left" ? "justify-end pr-4 sm:pr-8" : "justify-start pl-4 sm:pl-8";

  return (
    <div
      className={cn(
        "from-muted/40 to-background relative -z-10 flex h-64 items-end overflow-hidden rounded-3xl bg-gradient-to-b sm:h-80",
        alignment,
      )}
    >
      {hasImage ? (
        <Image
          src={item?.thumbnailUrl ?? "/image-temp.png"}
          alt={item?.name ?? "Gear thumbnail"}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-contain object-center"
          priority
        />
      ) : (
        <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs tracking-wide uppercase">
          Image coming soon
        </div>
      )}
    </div>
  );
}
