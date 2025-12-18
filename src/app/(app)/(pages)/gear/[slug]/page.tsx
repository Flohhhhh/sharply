import Link from "next/link";
import { getItemDisplayPrice, PRICE_FALLBACK_TEXT } from "~/lib/mapping";
import { formatHumanDate, getConstructionState } from "~/lib/utils";
import { GearActionButtons } from "~/app/(app)/(pages)/gear/_components/gear-action-buttons";
import {
  fetchOwnershipStatus,
  fetchWishlistStatus,
  fetchPendingEditCountForGear,
} from "~/server/gear/service";
import { GearVisitTracker } from "~/app/(app)/(pages)/gear/_components/gear-visit-tracker";
import { GearReviews } from "~/app/(app)/(pages)/gear/_components/gear-reviews";
import { AiReviewBanner } from "../_components/ai-review-banner";
import {
  fetchGearBySlug,
  fetchUseCaseRatings,
  fetchStaffVerdict,
  fetchAllGearSlugs,
} from "~/server/gear/service";
import { ConstructionNotice } from "~/app/(app)/(pages)/gear/_components/construction-notice";
import { ConstructionFullPage } from "~/app/(app)/(pages)/gear/_components/construction-full";
import type { GearItem } from "~/types/gear";
import { GearContributors } from "~/app/(app)/(pages)/gear/_components/gear-contributors";
import { UserPendingEditBanner } from "../_components/user-pending-edit-banner";
import { SignInToEditSpecsCta } from "../_components/sign-in-to-edit-cta";
import { SuggestEditButton } from "../_components/suggest-edit-button";
import { GearLinks } from "~/app/(app)/(pages)/gear/_components/gear-links";
import GearStatsCard from "../_components/gear-stats-card";
import GearBadges from "../_components/gear-badges";
import SpecsTable from "../_components/specs-table";
import { ManageStaffVerdictModal } from "../_components/manage-staff-verdict-modal";
import { StaffVerdictSection } from "../_components/staff-verdict-section";
import { buildGearSpecsSections } from "~/lib/specs/registry";
import type { Metadata } from "next";
import { Breadcrumbs, type CrumbItem } from "~/components/layout/breadcrumbs";
import { getBrandNameById } from "~/lib/mapping/brand-map";
import { RenameGearButton } from "~/components/gear/rename-gear-button";
import {
  getReviewByGearSlug,
  getNewsByRelatedGearSlug,
} from "~/server/payload/service";
import { NewsCard } from "~/components/home/news-card";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { notFound } from "next/navigation";
import { auth } from "~/server/auth";
import { requireRole } from "~/server/auth/index";
import DiscordLink from "~/components/discord-link";
import DiscordBanner from "~/components/discord-banner";
import Image from "next/image";
// Removed LensApertureDisplay in favor of standardized spec rows using mapping
import { ExtractorDemo } from "../_components/extractor-demo";
import { JsonLd } from "~/components/json-ld";

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

  try {
    const item: GearItem = await fetchGearBySlug(slug);
    const verdict = await fetchStaffVerdict(slug).catch(() => null);
    const description = verdict
      ? (verdict?.content ?? "")
      : `Sharply is the newest and most comprehensive photography gear database and review platform featuring expert reviews, real specs, and side-by-side comparisons in a modern, minimalist interface.`;
    return {
      title: `${item.name} | Specs & Reviews`,
      description,
      openGraph: {
        title: `${item.name} | Specs & Reviews`,
        images: [item.thumbnailUrl ?? ""],
        description,
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
  const session = await auth();
  const isAdmin = requireRole(session, ["ADMIN"]);
  // console.log("[gear/[slug]] Generating static page (build/ISR)", { slug });

  // Fetch core gear data
  const item = await fetchGearBySlug(slug).catch((err: any) => {
    if ((err as any)?.status === 404) return null;
    throw err;
  });

  if (!item) return notFound();

  const priceDisplay = getItemDisplayPrice(item);

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

  // Under construction state
  const construction = getConstructionState(item);

  if (construction.underConstruction) {
    return (
      <main className="mx-auto mt-24 min-h-screen max-w-4xl p-6">
        <ConstructionFullPage
          gearName={item.name}
          missing={construction.missing}
          editHref={`/gear/${item.slug}/edit?type=${item.gearType}`}
          slug={item.slug}
          gearType={item.gearType as "CAMERA" | "LENS"}
        />
      </main>
    );
  }

  const specSections = buildGearSpecsSections(item);
  const brand = getBrandNameById(item.brandId ?? "");

  // console.log("[GearPage] item", item);

  const breadCrumbItems = [
    { label: "Gear", href: "/gear" },
    brand ? { label: brand, href: `/brand/${brand.toLowerCase()}` } : null,
    { label: item.name },
  ].filter(Boolean) as CrumbItem[];

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 pt-20 sm:px-6">
      {/* Track page visit for popularity */}
      <GearVisitTracker slug={slug} />

      <section className="space-y-4">
        <Breadcrumbs items={breadCrumbItems} />
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
            <h1 className="text-3xl font-bold sm:text-5xl">{item.name}</h1>
            <RenameGearButton
              gearId={item.id}
              currentName={item.name}
              currentSlug={item.slug}
            />
          </div>
          <div className="mt-2 text-lg font-semibold sm:text-2xl">
            {priceDisplay === PRICE_FALLBACK_TEXT ? (
              <span className="text-muted-foreground">{priceDisplay}</span>
            ) : (
              priceDisplay
            )}
          </div>
        </div>
        {/* Badges */}
        <div>
          <GearBadges slug={slug} />
        </div>
        {/* Photo Placeholder */}
        <div>
          {item.thumbnailUrl ? (
            <div className="bg-muted dark:bg-card min-h-[420px] overflow-hidden rounded-md p-12 sm:p-24">
              <Image
                src={item.thumbnailUrl}
                alt={item.name}
                className="mx-auto h-full max-h-[300px] w-full max-w-[600px] object-contain sm:max-h-[420px]"
                width={720}
                height={480}
                priority
              />
            </div>
          ) : (
            <div className="bg-muted dark:bg-card flex aspect-video items-center justify-center rounded-md">
              <div className="text-muted-foreground text-lg">
                No image available
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Intra-page nav bar */}
      <section className="bg-background sticky top-16 z-10 border-b py-2">
        <div className="flex items-center justify-center gap-8">
          {/* specs, reviews, contributors */}
          <Link
            href={`#specs`}
            className="text-muted-foreground hover:text-primary text-sm transition-all hover:underline"
          >
            Specs
          </Link>
          <Link
            href={`#staff-verdict`}
            className="text-muted-foreground hover:text-primary text-sm transition-all hover:underline"
          >
            Staff Verdict
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
          {(staffVerdictRows.length > 0 || isAdmin) && (
            <StaffVerdictSection slug={slug} verdict={verdict} />
          )}

          {/* Specifications */}
          <section className="scroll-mt-24" id="specs">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="mb-2 text-lg font-semibold">Specifications</h2>
              <SuggestEditButton
                slug={item.slug}
                gearType={item.gearType as "CAMERA" | "LENS"}
              />
            </div>
            <SpecsTable sections={specSections} item={item} />
          </section>
          {/* Sign-in CTA banner for editing specs (client, only when signed out) */}
          <SignInToEditSpecsCta
            slug={item.slug}
            gearType={item.gearType as "CAMERA" | "LENS"}
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
          {/* Articles about this item (below specs) */}
          {relatedNews.length > 0 && (
            <section id="related-articles" className="scroll-mt-24">
              <h2 className="mb-2 text-lg font-semibold">
                Articles about this item
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        </div>
        {/* Right column */}
        <div className="static top-28 col-span-1 -mt-4 w-full space-y-8 self-start sm:sticky md:col-span-3">
          {/* Action Buttons */}
          <div className="w-full">
            {(() => {
              // Compute initial flags on the server and render client component with props
              // Note: this closure is immediately invoked synchronously with awaited calls inside
              // eslint-disable-next-line react/no-unstable-nested-components
              const ServerWrapper = async () => {
                let initialInWishlist: boolean | null = null;
                let initialIsOwned: boolean | null = null;
                try {
                  const [wl, own] = await Promise.all([
                    fetchWishlistStatus(slug).catch(() => null),
                    fetchOwnershipStatus(slug).catch(() => null),
                  ]);
                  initialInWishlist = wl ? Boolean(wl.inWishlist) : null;
                  initialIsOwned = own ? Boolean(own.isOwned) : null;
                } catch {}
                return (
                  <GearActionButtons
                    slug={slug}
                    initialInWishlist={initialInWishlist}
                    initialIsOwned={initialIsOwned}
                    currentThumbnailUrl={item.thumbnailUrl ?? null}
                  />
                );
              };
              return <ServerWrapper />;
            })()}
          </div>
          {/* Links */}
          <div className="mb-8">
            <GearLinks
              slug={item.slug}
              brandName={brand ?? null}
              linkManufacturer={item.linkManufacturer ?? null}
              linkMpb={item.linkMpb ?? null}
              linkAmazon={item.linkAmazon ?? null}
              mpbMaxPriceUsdCents={item.mpbMaxPriceUsdCents ?? null}
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
      <JsonLd gear={item} />
    </main>
  );
}

export async function generateStaticParams() {
  const slugs = await fetchAllGearSlugs();
  return slugs.map((slug) => ({ slug }));
}
