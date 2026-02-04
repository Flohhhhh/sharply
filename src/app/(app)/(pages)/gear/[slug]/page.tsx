import Link from "next/link";
import { getItemDisplayPrice, PRICE_FALLBACK_TEXT } from "~/lib/mapping";
import { formatHumanDate, getConstructionState } from "~/lib/utils";
import { GearActionButtons } from "~/app/(app)/(pages)/gear/_components/gear-action-buttons";
import { fetchPendingEditCountForGear } from "~/server/gear/service";
import { GearVisitTracker } from "~/app/(app)/(pages)/gear/_components/gear-visit-tracker";
import { GearReviews } from "~/app/(app)/(pages)/gear/_components/gear-reviews";
import { AiReviewBanner } from "../_components/ai-review-banner";
import {
  fetchGearBySlug,
  fetchUseCaseRatings,
  fetchStaffVerdict,
  fetchAllGearSlugs,
  fetchGearAlternatives,
} from "~/server/gear/service";
import { ConstructionFullPage } from "~/app/(app)/(pages)/gear/_components/construction-full";
import type { GearItem } from "~/types/gear";
import { GearContributors } from "~/app/(app)/(pages)/gear/_components/gear-contributors";
import { UserPendingEditBanner } from "../_components/user-pending-edit-banner";
import { SignInToEditSpecsCta } from "../_components/sign-in-to-edit-cta";
import { SuggestEditButton } from "../_components/suggest-edit-button";
import { GearLinks } from "~/app/(app)/(pages)/gear/_components/gear-links";
import GearStatsCard from "../_components/gear-stats-card";
import { TrendingBadge } from "~/components/gear-badges/trending-badge";
import { NewBadge } from "~/components/gear-badges/new-badge";
import { isNewRelease } from "~/lib/utils/is-new";
import { getTrendingStatusForSlugs } from "~/server/popularity/service";
import SpecsTable from "../_components/specs-table";
import { buildGearSpecsSections } from "~/lib/specs/registry";
import type { GearType } from "~/types/gear";
import type { Metadata } from "next";
import { Breadcrumbs, type CrumbItem } from "~/components/layout/breadcrumbs";
import { getBrandNameById } from "~/lib/mapping/brand-map";
import { RenameGearButton } from "~/components/gear/rename-gear-button";
import {
  getReviewByGearSlug,
  getNewsByRelatedGearSlug,
} from "~/server/payload/service";
import { NewsCard } from "~/components/home/news-card";
import { Button } from "~/components/ui/button";
import { notFound } from "next/navigation";
import DiscordBanner from "~/components/discord-banner";
import Image from "next/image";
import { JsonLd } from "~/components/json-ld";
import { GearImageCarousel } from "~/app/(app)/(pages)/gear/_components/gear-image-carousel";
import { StaffVerdictSection } from "../_components/staff-verdict-section";
import { HallOfFameBadge } from "~/components/gear-badges/hall-of-fame-badge";
import { isInHallOfFame } from "~/lib/utils/is-in-hall-of-fame";
import { GearAlternativesSection } from "../_components/gear-alternatives-section";
import { BookImageIcon, Download, FileDown } from "lucide-react";
import {
  Item,
  ItemContent,
  ItemActions,
  ItemDescription,
  ItemTitle,
} from "~/components/ui/item";
import { GearItemDock } from "~/components/gear/gear-tools-dock/gear-item-dock";
import { auth } from "~/auth";
import { headers } from "next/headers";
import { GearDisplayName } from "~/components/gear/gear-display-name";
import { GetGearDisplayName } from "~/lib/gear/naming";
import { resolveRegionFromCountryCode } from "~/lib/gear/region";

export const revalidate = 3600;

interface GearPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: GearPageProps): Promise<Metadata> {
  const { slug } = await params;
  const headerList = await headers();

  try {
    const item: GearItem = await fetchGearBySlug(slug);
    const verdict = await fetchStaffVerdict(slug).catch(() => null);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      throw new Error(
        "Tried to generate metadata without NEXT_PUBLIC_BASE_URL being set",
      );
    }
    const displayName = GetGearDisplayName({
      name: item.name,
      regionalAliases: item.regionalAliases ?? [],
    });
    const description = verdict
      ? (verdict?.content ?? "")
      : `Sharply is the newest and most comprehensive photography gear database and review platform featuring expert reviews, real specs, and side-by-side comparisons in a modern, minimalist interface.`;
    const ogImage = item.thumbnailUrl
      ? {
          url: item.thumbnailUrl,
          width: 1200,
          height: 630,
          alt: `${displayName}`,
        }
      : {
          url: `${baseUrl}/og-default.png`,
          width: 1200,
          height: 630,
          alt: "Sharply - Photography Gear Database",
        };
    return {
      title: `${displayName} | Specs & Reviews`,
      description,
      alternates: {
        canonical: `${baseUrl}/gear/${slug}`,
      },
      openGraph: {
        type: "website",
        title: `${displayName} | Specs & Reviews`,
        images: [ogImage],
        url: `${baseUrl}/gear/${slug}`,
        description,
      },
      twitter: {
        card: "summary_large_image",
        title: `${displayName} | Specs & Reviews`,
        description,
        images: [ogImage.url],
      },
    };
  } catch (err: any) {
    if (err?.status === 404) {
      return {
        title: "Item not found",
        description: "The requested gear could not be found.",
        robots: { index: false, follow: false },
        openGraph: {
          title: "Item not found",
          images: [],
          description: "The requested gear could not be found.",
        },
      };
    }
    throw err;
  }
}

export default async function GearPage({ params }: GearPageProps) {
  const { slug } = await params;
  // console.log("[gear/[slug]] Generating static page (build/ISR)", { slug });

  const headerList = await headers();

  // Fetch core gear data
  const item = await fetchGearBySlug(slug).catch((err: any) => {
    if ((err as any)?.status === 404) return null;
    throw err;
  });

  if (!item) return notFound();

  const priceDisplay = getItemDisplayPrice(item);
  const displayName = GetGearDisplayName({
    name: item.name,
    regionalAliases: item.regionalAliases ?? [],
  });

  // Check auth status for image request feature
  const session = await auth.api.getSession({
    headers: headerList,
  });
  const isAuthenticated = !!session?.user;

  // Fetch image request status only for authenticated users
  let hasImageRequest: boolean | null = null;
  if (isAuthenticated) {
    try {
      const { fetchImageRequestStatus } = await import("~/server/gear/service");
      const status = await fetchImageRequestStatus(slug).catch(() => null);
      hasImageRequest = status ? status.hasRequested : false;
    } catch {
      hasImageRequest = false;
    }
  }

  // Fetch editorial content
  const [ratingsRows, staffVerdictRows, pendingChangeRequests] =
    await Promise.all([
      fetchUseCaseRatings(slug),
      (async () => {
        const v = await fetchStaffVerdict(slug);
        return v ? [v] : [];
      })(),
      fetchPendingEditCountForGear(item.id),
    ]);

  const ratings = (ratingsRows ?? []).filter((r) => r.genreId != null);
  ratings.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const verdict = staffVerdictRows?.[0] ?? null;

  const review = await getReviewByGearSlug(item.slug);
  const relatedNews = await getNewsByRelatedGearSlug(item.slug, 9);
  const alternatives = await fetchGearAlternatives(slug);
  const isNew = isNewRelease(item.releaseDate, item.releaseDatePrecision);

  // Check trending status for this item and all alternatives
  const allSlugs = [item.slug, ...alternatives.map((alt) => alt.slug)];
  const trendingSlugs = await getTrendingStatusForSlugs(allSlugs, {
    timeframe: "30d",
    limit: 20,
  });
  const isTrending = trendingSlugs.has(item.slug);
  const isHallOfFameItem = isInHallOfFame(item.slug);

  // Under construction state
  const construction = getConstructionState(item);

  if (construction.underConstruction) {
    return (
      <main className="mx-auto mt-24 min-h-screen max-w-4xl p-6">
        <ConstructionFullPage
          gearName={displayName}
          missing={construction.missing}
          editHref={`/gear/${item.slug}/edit?type=${item.gearType}`}
          slug={item.slug}
          gearType={item.gearType as "CAMERA" | "ANALOG_CAMERA" | "LENS"}
        />
      </main>
    );
  }

  const countryHeader =
    headerList.get("x-vercel-ip-country") ??
    headerList.get("x-geo-country") ??
    headerList.get("x-edge-country") ??
    null;
  const viewerRegion = resolveRegionFromCountryCode(countryHeader);

  const specSections = buildGearSpecsSections(item, { viewerRegion });
  const brand = getBrandNameById(item.brandId ?? "");

  // console.log("[GearPage] item", item);

  const breadCrumbItems = [
    { label: "Gear", href: "/gear" },
    brand ? { label: brand, href: `/brand/${brand.toLowerCase()}` } : null,
    { label: displayName },
  ].filter(Boolean) as CrumbItem[];

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 pt-20 sm:px-6">
      <GearItemDock
        slug={slug}
        gearId={item.id}
        gearType={item.gearType}
        currentThumbnailUrl={item.thumbnailUrl ?? null}
        currentTopViewUrl={item.topViewUrl ?? null}
        alternatives={alternatives}
        rawSamples={item.rawSamples ?? []}
      />
      {/* Track page visit for popularity */}
      <GearVisitTracker slug={slug} />
      <section className="space-y-4">
        <div className="hidden sm:block">
          <Breadcrumbs items={breadCrumbItems} />
        </div>
        {/* Item Name and Brand */}
        <div>
          <div className="flex items-center gap-3">
            {/* <span className="bg-secondary rounded-full px-3 py-1 text-xs font-medium">
            {item.gearType}
          </span> */}
            {item.brands && (
              <Link
                href={`/brand/${item.brands.slug}`}
                className="text-muted-foreground text-sm"
              >
                {item.brands.name}
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold sm:text-5xl">
              <GearDisplayName
                name={item.name}
                regionalAliases={item.regionalAliases}
              />
            </h1>
            <RenameGearButton
              gearId={item.id}
              currentName={item.name}
              currentSlug={item.slug}
              brandName={item.brands?.name ?? brand ?? null}
              regionalAliases={item.regionalAliases ?? undefined}
            />
          </div>
          <div className="mt-2 text-lg font-semibold sm:text-2xl">
            {priceDisplay === PRICE_FALLBACK_TEXT ? (
              <span className="text-muted-foreground">{priceDisplay}</span>
            ) : (
              priceDisplay
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {isHallOfFameItem ? <HallOfFameBadge /> : null}
            {isTrending ? <TrendingBadge /> : null}
            {isNew ? <NewBadge /> : null}
          </div>
        </div>
        {/* Photo Placeholder */}
        <div>
          <GearImageCarousel
            name={item.name}
            regionalAliases={item.regionalAliases}
            thumbnailUrl={item.thumbnailUrl}
            topViewUrl={item.topViewUrl}
            slug={slug}
            hasImageRequest={hasImageRequest}
          />
        </div>
      </section>

      {/* Intra-page nav bar */}
      <section className="bg-background sticky top-16 z-10 border-b py-2">
        <div className="flex items-center justify-center gap-8">
          {/* specs, reviews, contributors */}
          <Link
            href={`#staff-verdict`}
            className="text-muted-foreground hover:text-primary text-sm transition-all hover:underline"
          >
            Staff Verdict
          </Link>
          <Link
            href={`#specs`}
            className="text-muted-foreground hover:text-primary text-sm transition-all hover:underline"
          >
            Specs
          </Link>
          <Link
            href={`#reviews`}
            className="text-muted-foreground hover:text-primary text-sm transition-all hover:underline"
          >
            Reviews
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-10">
        <div className="col-span-1 space-y-4 md:col-span-7">
          {/* Pending submission banner (client, only for this user when pending) */}
          <UserPendingEditBanner slug={slug} />
          {/* Staff Verdict */}
          <StaffVerdictSection slug={slug} verdict={verdict} />

          {/* Specifications */}
          <section className="scroll-mt-24" id="specs">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="mb-2 text-lg font-semibold">Specifications</h2>
              <SuggestEditButton
                slug={item.slug}
                gearType={item.gearType as GearType}
              />
            </div>
            <SpecsTable sections={specSections} item={item} />
          </section>
          {/* Sign-in CTA banner for editing specs (client, only when signed out) */}
          <SignInToEditSpecsCta
            slug={item.slug}
            gearType={item.gearType as GearType}
          />
          {/* Editorial Reviews*/}
          {review && (
            <section id="reviews" className="scroll-mt-24">
              {/* <h2 className="mb-2 text-lg font-semibold">Our Review</h2> */}
              <Link href={`/reviews/${review.slug}`}>
                <div className="flex flex-col gap-2 rounded-md border p-4">
                  <span className="text-lg font-bold">{review.title}</span>
                  <p className="text-muted-foreground text-sm">
                    {review.review_summary}
                  </p>
                  <div className="mt-2">
                    <Button variant="outline" className="hover:cursor-pointer">
                      Read Full Review
                    </Button>
                  </div>
                </div>
              </Link>
            </section>
          )}
          {/* Raw Samples (only for cameras) */}
          {item.gearType === "CAMERA" &&
            item.rawSamples &&
            item.rawSamples.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Raw Samples</h3>
                <div className="space-y-2">
                  {item.rawSamples.map((sample) => (
                    <Item key={sample.id} variant="outline" size="sm">
                      <ItemContent>
                        <ItemTitle className="max-w-[70%] truncate text-sm font-medium">
                          {sample.originalFilename ?? sample.fileUrl}
                        </ItemTitle>
                      </ItemContent>
                      <ItemActions>
                        <Button
                          size="sm"
                          className="h-8 w-auto px-3 text-xs"
                          icon={<FileDown className="h-4 w-4" />}
                          asChild
                        >
                          <a
                            href={sample.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            download
                          >
                            Download
                          </a>
                        </Button>
                      </ItemActions>
                    </Item>
                  ))}
                </div>
              </div>
            )}
          {/* Alternatives */}
          <GearAlternativesSection
            alternatives={alternatives}
            trendingSlugs={trendingSlugs}
          />
        </div>
        {/* Right column */}
        <div className="static top-28 col-span-1 -mt-4 w-full space-y-8 self-start sm:sticky md:col-span-3">
          {/* Action Buttons */}
          <div className="w-full">
            <GearActionButtons
              slug={slug}
              name={item.name}
              regionalAliases={item.regionalAliases}
              gearType={item.gearType}
            />
          </div>
          {/* Links */}
          <div className="mb-8">
            <GearLinks
              slug={item.slug}
              brandName={brand ?? null}
              linkManufacturer={item.linkManufacturer ?? null}
              linkMpb={item.linkMpb ?? null}
              linkBh={item.linkBh ?? null}
              linkAmazon={item.linkAmazon ?? null}
              mpbMaxPriceUsdCents={item.mpbMaxPriceUsdCents ?? null}
              msrpNowUsdCents={item.msrpNowUsdCents ?? null}
            />
          </div>

          {/* Contributors */}
          <GearContributors gearId={item.id} />
          <GearStatsCard slug={slug} />
          {/* Page Metadata */}
          <div className="mt-8 border-t pt-6">
            <div className="text-muted-foreground space-y-2 text-sm">
              <div className="flex justify-between">
                Open Change Requests
                <span>{pendingChangeRequests}</span>
              </div>
              <div className="flex justify-between">
                <span>Item Created</span>
                <span>{formatHumanDate(item.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated</span>
                <span>{formatHumanDate(item.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section id="reviews" className="scroll-mt-24">
        <GearReviews
          slug={item.slug}
          bannerSlot={<AiReviewBanner gearId={item.id} />}
        />
      </section>

      <DiscordBanner />

      {/* Articles about this item */}
      {relatedNews.length > 0 && (
        <section id="related-articles" className="scroll-mt-24">
          <h2 className="mb-2 text-lg font-semibold">
            Articles about this item
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {relatedNews.map((post) => {
              const image =
                post.thumbnail && typeof post.thumbnail === "object"
                  ? (post.thumbnail.url ?? "/image-temp.png")
                  : "/image-temp.png";
              return (
                <NewsCard
                  key={post.id}
                  post={{
                    id: post.id,
                    title: post.title,
                    excerpt: (post.excerpt as any) ?? undefined,
                    href: `/news/${post.slug}`,
                    image,
                    date: new Date(
                      post.override_date || post.createdAt,
                    ).toLocaleDateString(),
                  }}
                  size="sm"
                />
              );
            })}
          </div>
        </section>
      )}

      <JsonLd gear={item} />
    </main>
  );
}

export async function generateStaticParams() {
  const slugs = await fetchAllGearSlugs();
  return slugs.map((slug) => ({ slug }));
}
