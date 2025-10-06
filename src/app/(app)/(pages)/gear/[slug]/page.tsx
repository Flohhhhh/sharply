import Link from "next/link";
import { formatPrice } from "~/lib/mapping";
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
import { buildGearSpecsSections } from "~/lib/specs/registry";
import type { Metadata } from "next";
import { Breadcrumbs, type CrumbItem } from "~/components/layout/breadcrumbs";
import { getBrandNameById } from "~/lib/mapping/brand-map";
import { RenameGearButton } from "~/components/gear/rename-gear-button";
import { getReviewByGearSlug } from "~/server/payload/service";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
// Removed LensApertureDisplay in favor of standardized spec rows using mapping

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
  const item: GearItem = await fetchGearBySlug(slug);
  const verdict = await fetchStaffVerdict(slug);
  const description = verdict
    ? `${item.name} specs and reviews. ${verdict?.content ?? ""}`
    : `${item.name} specs and reviews. Sharply is the newest and most comprehensive photography gear database and review platform featuring expert reviews, real specs, and side-by-side comparisons in a modern, minimalist interface.`;
  return {
    title: `${item.name} | Specs & Reviews`,
    description,
    openGraph: {
      title: `${item.name} | Specs & Reviews`,
      images: [item.thumbnailUrl ?? ""],
      description,
    },
  };
}

export default async function GearPage({ params }: GearPageProps) {
  const { slug } = await params;
  console.log("[gear/[slug]] Generating static page (build/ISR)", { slug });

  // Fetch core gear data
  const item: GearItem = await fetchGearBySlug(slug);
  // Specs (strongly typed via schema); avoid manual field mapping
  // const cameraSpecsItem =
  //   item.gearType === "CAMERA" ? (item.cameraSpecs ?? null) : null;
  // const lensSpecsItem =
  //   item.gearType === "LENS" ? (item.lensSpecs ?? null) : null;

  // console.log("[GearPage] item", item);
  // console.log("[GearPage] cameraSpecsItem", cameraSpecsItem);

  // Get sensor format if camera specs exist
  // let sensorFormat = null;
  // // sensor format id available on camera specs; join for name elsewhere
  // if (cameraSpecsItem?.sensorFormatId) {
  //   sensorFormat = {
  //     id: cameraSpecsItem.sensorFormatId,
  //     name: sensorNameFromId(cameraSpecsItem.sensorFormatId),
  //     slug: "",
  //   } as any;
  // }

  // Compute combined Sensor Type label (e.g., "Partially-Stacked BSI-CMOS")
  // const sensorTypeLabel = (() => {
  //   if (!cameraSpecsItem) return null;
  //   const parts: string[] = [];
  //   const stacking = cameraSpecsItem.sensorStackingType as
  //     | "unstacked"
  //     | "partially-stacked"
  //     | "fully-stacked"
  //     | null
  //     | undefined;
  //   if (stacking && stacking !== "unstacked") {
  //     let stackingLabel: string | null = null;
  //     if (stacking === "partially-stacked") stackingLabel = "Partially-Stacked";
  //     if (stacking === "fully-stacked") stackingLabel = "Stacked";
  //     if (stackingLabel) parts.push(stackingLabel);
  //   }
  //   const tech = cameraSpecsItem.sensorTechType
  //     ? String(cameraSpecsItem.sensorTechType).toUpperCase()
  //     : null;
  //   const bsi = cameraSpecsItem.isBackSideIlluminated ? "BSI" : null;
  //   const techSegment = [bsi, tech].filter(Boolean).join("-");
  //   if (techSegment) parts.push(techSegment);
  //   return parts.length ? parts.join(" ") : null;
  // })();

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

  // Under construction state
  const construction = getConstructionState(item);

  if (construction.underConstruction) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <ConstructionFullPage
          gearName={item.name}
          missing={construction.missing}
          editHref={`/gear/${item.slug}/edit?type=${item.gearType}`}
        />
      </main>
    );
  }

  const specSections = buildGearSpecsSections(item);
  const brand = getBrandNameById(item.brandId ?? "");

  const breadCrumbItems = [
    { label: "Gear", href: "/gear" },
    brand ? { label: brand, href: `/brand/${brand.toLowerCase()}` } : null,
    { label: item.name },
  ].filter(Boolean) as CrumbItem[];

  return (
    <main className="mx-auto max-w-7xl space-y-8 p-6 pt-20">
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
            <h1 className="text-5xl font-bold">{item.name}</h1>
            <RenameGearButton
              gearId={item.id}
              currentName={item.name}
              currentSlug={item.slug}
            />
          </div>
          {item.msrpNowUsdCents && (
            <div className="mt-2 text-2xl font-semibold">
              {formatPrice(item.msrpNowUsdCents)}
            </div>
          )}
        </div>
        {/* Badges */}
        <div>
          <GearBadges slug={slug} />
        </div>
        {/* Photo Placeholder */}
        <div>
          {item.thumbnailUrl ? (
            <div className="bg-muted h-[550px] overflow-hidden rounded-md py-12">
              <img
                src={item.thumbnailUrl}
                alt={item.name}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="bg-muted flex aspect-video items-center justify-center rounded-md">
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
        <div className="col-span-7 space-y-4">
          {/* Pending submission banner (client, only for this user when pending) */}
          <UserPendingEditBanner slug={slug} />
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
          {/* Staff Verdict */}
          <section id="staff-verdict" className="mt-12 scroll-mt-24 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Staff Verdict</h3>
              <ManageStaffVerdictModal slug={slug} />
            </div>
            {verdict &&
              Boolean(
                verdict.content ||
                  verdict.pros ||
                  verdict.cons ||
                  verdict.whoFor ||
                  verdict.notFor ||
                  verdict.alternatives,
              ) && (
                <div className="border-border overflow-hidden rounded-md border p-4">
                  {verdict.content && (
                    <div className="space-y-3">
                      {verdict.content
                        .split("\n")
                        .map((p: string, i: number) =>
                          p.trim() ? (
                            <p key={i} className="text-sm">
                              {p}
                            </p>
                          ) : (
                            <br key={i} />
                          ),
                        )}
                    </div>
                  )}

                  {(Array.isArray(verdict.pros) && verdict.pros.length > 0) ||
                  (Array.isArray(verdict.cons) && verdict.cons.length > 0) ? (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      {Array.isArray(verdict.pros) &&
                        verdict.pros.length > 0 && (
                          <div>
                            <div className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                              Pros
                            </div>
                            <ul className="list-disc pl-5 text-sm">
                              {(verdict.pros as string[]).map(
                                (p: string, i: number) => (
                                  <li key={i}>{p}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                      {Array.isArray(verdict.cons) &&
                        verdict.cons.length > 0 && (
                          <div>
                            <div className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                              Cons
                            </div>
                            <ul className="list-disc pl-5 text-sm">
                              {(verdict.cons as string[]).map(
                                (c: string, i: number) => (
                                  <li key={i}>{c}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  ) : null}

                  {(verdict.whoFor || verdict.notFor) && (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      {verdict.whoFor && (
                        <div>
                          <div className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                            Who it's for
                          </div>
                          <p className="text-sm">{verdict.whoFor}</p>
                        </div>
                      )}
                      {verdict.notFor && (
                        <div>
                          <div className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                            Not for
                          </div>
                          <p className="text-sm">{verdict.notFor}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {Array.isArray(verdict.alternatives) &&
                    verdict.alternatives.length > 0 && (
                      <div className="mt-4">
                        <div className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                          Top alternatives
                        </div>
                        <ul className="list-disc pl-5 text-sm">
                          {(verdict.alternatives as string[]).map(
                            (a: string, i: number) => (
                              <li key={i}>{a}</li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}
                </div>
              )}
          </section>
        </div>
        {/* Right column */}
        <div className="sticky top-28 col-span-3 -mt-4 space-y-8 self-start">
          {/* Action Buttons */}
          <div className="">
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
    </main>
  );
}

export async function generateStaticParams() {
  const slugs = await fetchAllGearSlugs();
  return slugs.map((slug) => ({ slug }));
}
