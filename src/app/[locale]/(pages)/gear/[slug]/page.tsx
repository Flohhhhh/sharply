import { FileDown } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConstructionFullPage } from "~/app/[locale]/(pages)/gear/_components/construction-full";
import { GearActionButtons } from "~/app/[locale]/(pages)/gear/_components/gear-action-buttons";
import { GearContributors } from "~/app/[locale]/(pages)/gear/_components/gear-contributors";
import { GearImageCarousel } from "~/app/[locale]/(pages)/gear/_components/gear-image-carousel";
import { GearLinks } from "~/app/[locale]/(pages)/gear/_components/gear-links";
import { GearReviews } from "~/app/[locale]/(pages)/gear/_components/gear-reviews";
import { GearVisitTracker } from "~/app/[locale]/(pages)/gear/_components/gear-visit-tracker";
import DiscordBanner from "~/components/discord-banner";
import { HallOfFameBadge } from "~/components/gear-badges/hall-of-fame-badge";
import { NewBadge } from "~/components/gear-badges/new-badge";
import { TrendingBadge } from "~/components/gear-badges/trending-badge";
import { GearDisplayName } from "~/components/gear/gear-display-name";
import { GearItemDock } from "~/components/gear/gear-tools-dock/gear-item-dock";
import { RenameGearButton } from "~/components/gear/rename-gear-button";
import { NewsCard } from "~/components/home/news-card";
import { JsonLd } from "~/components/json-ld";
import { Breadcrumbs,type CrumbItem } from "~/components/layout/breadcrumbs";
import { Button } from "~/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle
} from "~/components/ui/item";
import { formatDate,formatRelativeDate } from "~/lib/format/date";
import { GetGearDisplayName } from "~/lib/gear/naming";
import { resolveRegionFromCountryCode } from "~/lib/gear/region";
import { getItemDisplayPrice,PRICE_FALLBACK_TEXT } from "~/lib/mapping";
import { getBrandById } from "~/lib/mapping/brand-map";
import { buildGearMetaDescription } from "~/lib/seo/build-gear-meta-description";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";
import { buildGearSpecsSections } from "~/lib/specs/registry";
import { shouldPrebuildHeavyRouteLocale } from "~/lib/static-generation";
import { getConstructionState } from "~/lib/utils";
import { isInHallOfFame } from "~/lib/utils/is-in-hall-of-fame";
import { isNewRelease } from "~/lib/utils/is-new";
import { fetchPublicGearCreatorVideos } from "~/server/creator-videos/service";
import { fetchGearAlternatives,fetchGearBySlug,fetchNewestGearSlugs,fetchPendingEditCountForGear,fetchStaffVerdict,fetchUseCaseRatings } from "~/server/gear/service";
import {
  getNewsByRelatedGearSlug,
  getReviewByGearSlug,
} from "~/server/payload/service";
import {
  fetchHighTrafficGearSlugs,
  fetchTrendingSlugs,
  getTrendingStatusForSlugs,
} from "~/server/popularity/service";
import type { GearItem } from "~/types/gear";
import { AiReviewBanner } from "../_components/ai-review-banner";
import { CreatorVideosSection } from "../_components/creator-videos-section";
import { EditAppliedToast } from "../_components/edit-applied-toast";
import { GearAlternativesSection } from "../_components/gear-alternatives-section";
import { buildGearBreadcrumbItems } from "../_components/gear-breadcrumb-items";
import { GearBreadcrumbNameHydrator } from "../_components/gear-breadcrumb-name-hydrator";
import { buildGearSectionNavItems } from "../_components/gear-section-nav";
import GearStatsCard from "../_components/gear-stats-card";
import { SignInToEditSpecsCta } from "../_components/sign-in-to-edit-cta";
import { SpecsSection } from "../_components/specs-section";
import { StaffVerdictSection } from "../_components/staff-verdict-section";
import { UserPendingEditBanner } from "../_components/user-pending-edit-banner";

export const revalidate = 3600;
export const dynamicParams = true;

const GEAR_PREBUILD_TRENDING_LIMIT = 100;
const GEAR_PREBUILD_NEWEST_LIMIT = 100;
const GEAR_PREBUILD_HIGH_TRAFFIC_LIMIT = 175;

interface GearPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
  searchParams: Promise<{
    editApplied?: string;
  }>;
}

export async function generateMetadata({
  params,
}: GearPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const viewerRegion = resolveRegionFromCountryCode(null);
  const t = await getTranslations({ locale, namespace: "gearDetail" });

  try {
    const item: GearItem = await fetchGearBySlug(slug);
    const verdict = await fetchStaffVerdict(slug).catch(() => null);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      throw new Error(
        "Tried to generate metadata without NEXT_PUBLIC_BASE_URL being set",
      );
    }
    const displayName = GetGearDisplayName(
      {
        name: item.name,
        regionalAliases: item.regionalAliases ?? [],
      },
      { region: viewerRegion },
    );
    const description = buildGearMetaDescription({
      gear: item,
      displayName,
      staffVerdictContent: verdict?.content ?? null,
    });
    const ogImages = item.thumbnailUrl
      ? [
          {
            url: item.thumbnailUrl,
            // width: 1200,
            // height: 630,
            alt: `${displayName}`,
          },
        ]
      : [];
    const twitterImages = item.thumbnailUrl ? [item.thumbnailUrl] : [];
    return buildLocalizedMetadata(`/gear/${slug}`, {
      title: `${displayName} | ${t("metaTitleSuffix")}`,
      description,
      openGraph: {
        type: "website",
        title: `${displayName} | ${t("metaTitleSuffix")}`,
        images: ogImages,
        url: `${baseUrl}/gear/${slug}`,
        description,
      },
      twitter: {
        card: "summary_large_image",
        title: `${displayName} | ${t("metaTitleSuffix")}`,
        description,
        images: twitterImages,
      },
    });
  } catch (err: any) {
    if (err?.status === 404) {
      return {
        title: t("itemNotFoundTitle"),
        description: t("itemNotFoundDescription"),
        robots: { index: false, follow: false },
        openGraph: {
          title: t("itemNotFoundTitle"),
          images: [],
          description: t("itemNotFoundDescription"),
        },
      };
    }
    throw err;
  }
}

export default async function GearPage({
  params,
  searchParams,
}: GearPageProps) {
  const { locale, slug } = await params;
  const { editApplied } = await searchParams;
  const t = await getTranslations({ locale, namespace: "gearDetail" });
  // console.log("[gear/[slug]] Generating static page (build/ISR)", { slug });
  const viewerRegion = resolveRegionFromCountryCode(null);

  // Fetch core gear data
  const item = await fetchGearBySlug(slug).catch((err: any) => {
    if ((err)?.status === 404) return null;
    throw err;
  });

  if (!item) return notFound();

  const priceDisplay = getItemDisplayPrice(item);
  const regionalDisplayName = GetGearDisplayName(
    {
      name: item.name,
      regionalAliases: item.regionalAliases ?? [],
    },
    { region: viewerRegion },
  );

  const isAuthenticated = false;
  const hasImageRequest: boolean | null = null;

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

  const [review, relatedNews, alternatives, creatorVideos] = await Promise.all([
    getReviewByGearSlug(item.slug),
    getNewsByRelatedGearSlug(item.slug, 9),
    fetchGearAlternatives(slug),
    fetchPublicGearCreatorVideos(slug),
  ]);
  const isNew = isNewRelease(
    item.releaseDate ?? item.announcedDate,
    item.releaseDatePrecision ?? item.announceDatePrecision,
  );

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
          gearName={regionalDisplayName}
          missing={construction.missing}
          slug={item.slug}
          gearType={item.gearType}
        />
      </main>
    );
  }

  const specSections = buildGearSpecsSections(item, {
    locale,
    t,
    viewerRegion,
  });
  const brand = getBrandById(item.brandId ?? "");

  // console.log("[GearPage] item", item);

  const breadCrumbItems = [
    ...buildGearBreadcrumbItems({
      brandId: brand?.id ?? item.brandId ?? null,
      brandName: brand?.name ?? null,
      brandSlug: brand?.slug ?? null,
      gearType: item.gearType,
      mountId: item.mountId,
      mountIds: item.mountIds,
      labels: {
        gear: t("gear"),
        cameras: t("cameras"),
        lenses: t("lenses"),
      },
    }),
    {
      label: (
        <span data-gear-breadcrumb-label data-gear-breadcrumb-slug={item.slug}>
          {regionalDisplayName}
        </span>
      ),
    },
  ].filter(Boolean) as CrumbItem[];
  const sectionNavItems = buildGearSectionNavItems({
    hasEditorialReview: Boolean(review),
    hasCreatorVideos: creatorVideos.length > 0,
    hasRawSamples: Boolean(
      item.gearType === "CAMERA" &&
      item.rawSamples &&
      item.rawSamples.length > 0,
    ),
    hasAlternatives: alternatives.length > 0,
    hasRelatedArticles: relatedNews.length > 0,
    verdict,
    labels: {
      staffVerdict: t("staffVerdict"),
      specs: t("specs"),
      review: t("review"),
      reviews: t("reviews"),
      rawSamples: t("rawSamples"),
      alternatives: t("alternatives"),
      creatorVideos: t("creatorVideos"),
      articles: t("articles"),
    },
  });

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 pt-20 sm:px-6">
      {editApplied === "1" ? <EditAppliedToast /> : null}
      <GearItemDock
        slug={slug}
        gearId={item.id}
        gearType={item.gearType}
        currentThumbnailUrl={item.thumbnailUrl ?? null}
        currentTopViewUrl={item.topViewUrl ?? null}
        alternatives={alternatives}
        rawSamples={item.rawSamples ?? []}
        hasCreatorVideos={creatorVideos.length > 0}
      />
      {/* Track page visit for popularity */}
      <GearVisitTracker slug={slug} />
      <section className="space-y-4">
        <div className="hidden sm:block">
          <Breadcrumbs items={breadCrumbItems} />
          <GearBreadcrumbNameHydrator
            slug={item.slug}
            name={item.name}
            regionalAliases={item.regionalAliases ?? []}
          />
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
              brandName={item.brands?.name ?? brand?.name ?? null}
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
      {sectionNavItems.length > 0 && (
        <section className="bg-background sticky top-16 z-10 hidden border-b py-2 md:block">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            {sectionNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-primary text-sm transition-all hover:underline"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-10">
        <div className="col-span-1 space-y-4 md:col-span-7">
          {/* Pending submission banner (client, only for this user when pending) */}
          <UserPendingEditBanner slug={slug} />
          {/* Staff Verdict */}
          <StaffVerdictSection slug={slug} verdict={verdict} />

          {/* Specifications */}
          <SpecsSection
            item={item}
            sections={specSections}
            slug={item.slug}
            gearType={item.gearType}
          />
          {/* Sign-in CTA banner for editing specs (client, only when signed out) */}
          <SignInToEditSpecsCta
            slug={item.slug}
            gearType={item.gearType}
          />
          {/* Editorial Reviews*/}
          {review && (
            <section id="editorial-review" className="scroll-mt-24">
              {/* <h2 className="mb-2 text-lg font-semibold">Our Review</h2> */}
              <Link href={`/reviews/${review.slug}`}>
                <div className="flex flex-col gap-2 rounded-md border p-4">
                  <span className="text-lg font-bold">{review.title}</span>
                  <p className="text-muted-foreground text-sm">
                    {review.review_summary}
                  </p>
                  <div className="mt-2">
                    <Button variant="outline" className="hover:cursor-pointer">
                      {t("readFullReview")}
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
              <section id="raw-samples" className="scroll-mt-24 space-y-3">
                <h3 className="text-lg font-semibold">{t("rawSamples")}</h3>
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
                            {t("download")}
                          </a>
                        </Button>
                      </ItemActions>
                    </Item>
                  ))}
                </div>
              </section>
            )}
          {/* Alternatives */}
          <GearAlternativesSection
            alternatives={alternatives}
            trendingSlugs={trendingSlugs}
          />

          <CreatorVideosSection videos={creatorVideos} />
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
              initialIsAuthenticated={isAuthenticated}
            />
          </div>
          {/* Links */}
          <div className="mb-8">
            <GearLinks
              slug={item.slug}
              gearType={item.gearType}
              mountIds={item.mountIds ?? null}
              brandName={item.brands?.name ?? brand?.name ?? null}
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
                {t("openChangeRequests")}
                <span>{pendingChangeRequests}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("itemCreated")}</span>
                <span>
                  {formatDate(item.createdAt, {
                    locale,
                    preset: "date-long",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t("lastUpdated")}</span>
                <span>
                  {formatRelativeDate(item.updatedAt, {
                    locale,
                    capitalize: true,
                  })}
                </span>
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
          <h2 className="mb-2 text-lg font-semibold">{t("articlesAboutItem")}</h2>
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
                    date: formatDate(post.override_date || post.createdAt, {
                      locale,
                      preset: "date-medium",
                    }),
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

export async function generateStaticParams({
  params,
}: {
  params: { locale: string };
}) {
  if (!shouldPrebuildHeavyRouteLocale(params.locale)) {
    return [];
  }

  const [trendingSlugs, newestSlugs, highTrafficSlugs] = await Promise.all([
    fetchTrendingSlugs({
      timeframe: "30d",
      limit: GEAR_PREBUILD_TRENDING_LIMIT,
    }),
    fetchNewestGearSlugs(GEAR_PREBUILD_NEWEST_LIMIT),
    fetchHighTrafficGearSlugs(GEAR_PREBUILD_HIGH_TRAFFIC_LIMIT),
  ]);

  const slugs = Array.from(
    new Set([...trendingSlugs, ...newestSlugs, ...highTrafficSlugs]),
  );

  return slugs.map((slug) => ({ slug }));
}
