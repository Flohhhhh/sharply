import Link from "next/link";
import { eq } from "drizzle-orm";
import { formatPrice } from "~/lib/mapping";
import { formatHumanDate, getConstructionState } from "~/lib/utils";
import { GearActionButtons } from "~/app/(pages)/gear/_components/gear-action-buttons";
import {
  fetchOwnershipStatus,
  fetchWishlistStatus,
} from "~/server/gear/service";
import { GearVisitTracker } from "~/app/(pages)/gear/_components/gear-visit-tracker";
import { GearReviews } from "~/app/(pages)/gear/_components/gear-reviews";
import { AiReviewBanner } from "../_components/ai-review-banner";
import {
  fetchGearBySlug,
  fetchUseCaseRatings,
  fetchStaffVerdict,
  fetchAllGearSlugs,
} from "~/server/gear/service";
import { ConstructionNotice } from "~/app/(pages)/gear/_components/construction-notice";
import { ConstructionFullPage } from "~/app/(pages)/gear/_components/construction-full";
import type { GearItem } from "~/types/gear";
import { GearContributors } from "~/app/(pages)/gear/_components/gear-contributors";
import { UserPendingEditBanner } from "../_components/user-pending-edit-banner";
import { SignInToEditSpecsCta } from "../_components/sign-in-to-edit-cta";
import { SuggestEditButton } from "../_components/suggest-edit-button";
import { GearLinks } from "~/app/(pages)/gear/_components/gear-links";
import GearStatsCard from "../_components/gear-stats-card";
import GearBadges from "../_components/gear-badges";
import SpecsTable from "../_components/specs-table";
import { buildGearSpecsSections } from "~/lib/specs/registry";
import type { Metadata } from "next";
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
  return {
    title: `${item.name}`,
  };
}

export default async function GearPage({ params }: GearPageProps) {
  const { slug } = await params;
  console.log("[gear/[slug]] Generating static page (build/ISR)", { slug });

  // Fetch core gear data
  const item: GearItem = await fetchGearBySlug(slug);
  // Specs (strongly typed via schema); avoid manual field mapping
  const cameraSpecsItem =
    item.gearType === "CAMERA" ? (item.cameraSpecs ?? null) : null;
  const lensSpecsItem =
    item.gearType === "LENS" ? (item.lensSpecs ?? null) : null;

  console.log("[GearPage] item", item);
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
  const [ratingsRows, staffVerdictRows] = await Promise.all([
    fetchUseCaseRatings(slug),
    (async () => {
      const v = await fetchStaffVerdict(slug);
      return v ? [v] : [];
    })(),
  ]);

  const ratings = (ratingsRows ?? []).filter((r) => r.genreId != null);
  ratings.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const verdict = staffVerdictRows?.[0] ?? null;

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

  return (
    <main className="mx-auto max-w-4xl p-6 pt-20">
      {/* Track page visit for popularity */}
      <GearVisitTracker slug={slug} />
      {/* TODO: replace with breadcrumbs */}
      <div className="mb-6">
        <Link
          href="/gear"
          className="text-primary flex items-center gap-2 text-sm"
        >
          ← Back to Gear
        </Link>
      </div>
      {/* Item Name and Brand */}
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-3">
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
        <h1 className="text-3xl font-bold">{item.name}</h1>
        {item.msrpNowUsdCents && (
          <div className="mt-2 text-2xl font-semibold">
            {formatPrice(item.msrpNowUsdCents)}
          </div>
        )}
      </div>
      {/* Badges */}
      <div className="mb-4">
        <GearBadges slug={slug} />
      </div>
      {/* Photo Placeholder */}
      <div className="mb-6">
        {item.thumbnailUrl ? (
          <div className="bg-muted aspect-video overflow-hidden rounded-md">
            <img
              src={item.thumbnailUrl}
              alt={item.name}
              className="h-full w-full object-cover"
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
      {/* Popularity Stats */}
      <div className="mb-8">
        <GearStatsCard slug={slug} />
      </div>
      {/* Pending submission banner (client, only for this user when pending) */}
      <UserPendingEditBanner slug={slug} />
      {/* Action Buttons */}
      <div className="mb-8">
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
          linkManufacturer={item.linkManufacturer ?? null}
          linkMpb={item.linkMpb ?? null}
          linkAmazon={item.linkAmazon ?? null}
          mpbMaxPriceUsdCents={item.mpbMaxPriceUsdCents ?? null}
        />
      </div>
      {/* Suggest Edit Button */}
      <div className="mb-6">
        <SuggestEditButton
          slug={item.slug}
          gearType={item.gearType as "CAMERA" | "LENS"}
        />
      </div>

      {/* Specifications */}
      <SpecsTable sections={specSections} item={item} />
      {/* Sign-in CTA banner for editing specs (client, only when signed out) */}
      <SignInToEditSpecsCta
        slug={item.slug}
        gearType={item.gearType as "CAMERA" | "LENS"}
      />
      {/* Use-case performance */}
      {ratings.length > 0 && (
        <div className="mt-12 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Use‑case performance</h3>
          </div>
          <div className="border-border overflow-hidden rounded-md border">
            <div className="divide-border divide-y">
              {ratings.map((r) => (
                <div key={r.genreId} className="px-4 py-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium">{r.genreName}</span>
                    <span className="text-muted-foreground text-sm">
                      {r.score}/10
                    </span>
                  </div>
                  <div className="bg-muted relative h-2 w-full overflow-hidden rounded">
                    <div
                      className="bg-primary h-2 rounded"
                      style={{
                        width: `${Math.max(0, Math.min(10, r.score)) * 10}%`,
                      }}
                    />
                  </div>
                  {r.note && (
                    <div className="text-muted-foreground mt-2 text-sm">
                      {r.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Staff Verdict */}
      {verdict &&
        Boolean(
          verdict.content ||
            verdict.pros ||
            verdict.cons ||
            verdict.whoFor ||
            verdict.notFor ||
            verdict.alternatives,
        ) && (
          <div className="mt-12 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Staff Verdict</h3>
            </div>
            <div className="border-border overflow-hidden rounded-md border p-4">
              {verdict.content && (
                <div className="space-y-3">
                  {verdict.content.split("\n").map((p: string, i: number) =>
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
                  {Array.isArray(verdict.pros) && verdict.pros.length > 0 && (
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
                  {Array.isArray(verdict.cons) && verdict.cons.length > 0 && (
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
          </div>
        )}
      {/* Reviews */}
      <GearReviews
        slug={item.slug}
        bannerSlot={<AiReviewBanner gearId={item.id} />}
      />
      {/* Contributors */}
      <GearContributors gearId={item.id} />
      {/* Page Metadata */}
      <div className="mt-8 border-t pt-6">
        <div className="text-muted-foreground space-y-2 text-sm">
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
    </main>
  );
}

export async function generateStaticParams() {
  const slugs = await fetchAllGearSlugs();
  return slugs.map((slug) => ({ slug }));
}
