import Link from "next/link";
import { eq } from "drizzle-orm";
import { formatPrice, getMountDisplayName } from "~/lib/mapping";
import { formatHumanDate, getConstructionState } from "~/lib/utils";
import { GearActionButtons } from "~/app/(pages)/gear/_components/gear-action-buttons";
import {
  fetchOwnershipStatus,
  fetchWishlistStatus,
} from "~/server/gear/service";
import { GearVisitTracker } from "~/app/(pages)/gear/_components/gear-visit-tracker";
import { GearReviews } from "~/app/(pages)/gear/_components/gear-reviews";
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

export const revalidate = 3600;

interface GearPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function GearPage({ params }: GearPageProps) {
  const { slug } = await params;
  console.log("[gear/[slug]] Generating static page (build/ISR)", { slug });

  // Fetch core gear data
  const item: GearItem = await fetchGearBySlug(slug);

  // Fetch additional specs that aren't in the core helper yet
  const [cameraSpecsData, lensSpecsData] = await Promise.all([
    (async () =>
      item.gearType === "CAMERA"
        ? [
            {
              sensorFormatId: item.cameraSpecs?.sensorFormatId ?? null,
              resolutionMp: item.cameraSpecs?.resolutionMp ?? null,
              isoMin: item.cameraSpecs?.isoMin ?? null,
              isoMax: item.cameraSpecs?.isoMax ?? null,
              maxFpsRaw: item.cameraSpecs?.maxFpsRaw ?? null,
              maxFpsJpg: item.cameraSpecs?.maxFpsJpg ?? null,
              extra: item.cameraSpecs?.extra ?? null,
            },
          ]
        : [])(),
    (async () =>
      item.gearType === "LENS"
        ? [
            {
              focalLengthMinMm: item.lensSpecs?.focalLengthMinMm ?? null,
              focalLengthMaxMm: item.lensSpecs?.focalLengthMaxMm ?? null,
              hasStabilization: item.lensSpecs?.hasStabilization ?? null,
              extra: item.lensSpecs?.extra ?? null,
            },
          ]
        : [])(),
  ]);

  // Get sensor format if camera specs exist
  let sensorFormat = null;
  // sensor format already included in item.cameraSpecs via service (mapped with schema)
  if (cameraSpecsData.length > 0 && cameraSpecsData[0]?.sensorFormatId) {
    sensorFormat = {
      id: cameraSpecsData[0].sensorFormatId,
      name: "",
      slug: "",
    } as any;
  }

  const cameraSpecsItem = cameraSpecsData[0] || null;
  const lensSpecsItem = lensSpecsData[0] || null;

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

  return (
    <main className="mx-auto max-w-4xl p-6 pt-20">
      {/* Track page visit for popularity */}
      <GearVisitTracker slug={slug} />

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
        {item.msrpUsdCents && (
          <div className="mt-2 text-2xl font-semibold">
            {formatPrice(item.msrpUsdCents)}
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Specifications</h2>
          <SuggestEditButton
            slug={item.slug}
            gearType={item.gearType as "CAMERA" | "LENS"}
            variant="secondary"
          />
        </div>
        <div className="border-border overflow-hidden rounded-md border">
          <div className="divide-border divide-y">
            {item.mounts && (
              <div className="flex justify-between px-4 py-3">
                <span className="text-muted-foreground">Mount</span>
                <span className="font-medium">
                  {getMountDisplayName(item.mounts.value)}
                </span>
              </div>
            )}

            {item.releaseDate && (
              <div className="flex justify-between px-4 py-3">
                <span className="text-muted-foreground">Release Date</span>
                <span className="font-medium">
                  {formatHumanDate(item.releaseDate)}
                </span>
              </div>
            )}

            {/* Camera-specific specifications */}
            {item.gearType === "CAMERA" && cameraSpecsItem && (
              <>
                {cameraSpecsItem.resolutionMp && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">Resolution</span>
                    <span className="font-medium">
                      {cameraSpecsItem.resolutionMp} MP
                    </span>
                  </div>
                )}

                {sensorFormat && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">Sensor Format</span>
                    <span className="font-medium">{sensorFormat.name}</span>
                  </div>
                )}

                {cameraSpecsItem.isoMin && cameraSpecsItem.isoMax && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">ISO Range</span>
                    <span className="font-medium">
                      {cameraSpecsItem.isoMin} - {cameraSpecsItem.isoMax}
                    </span>
                  </div>
                )}

                {cameraSpecsItem.maxFpsRaw && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">Max FPS (RAW)</span>
                    <span className="font-medium">
                      {cameraSpecsItem.maxFpsRaw} fps
                    </span>
                  </div>
                )}

                {cameraSpecsItem.maxFpsJpg && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">
                      Max FPS (JPEG)
                    </span>
                    <span className="font-medium">
                      {cameraSpecsItem.maxFpsJpg} fps
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Lens-specific specifications */}
            {item.gearType === "LENS" && lensSpecsItem && (
              <>
                {lensSpecsItem.focalLengthMinMm &&
                  lensSpecsItem.focalLengthMaxMm && (
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-muted-foreground">
                        Focal Length
                      </span>
                      <span className="font-medium">
                        {lensSpecsItem.focalLengthMinMm ===
                        lensSpecsItem.focalLengthMaxMm
                          ? `${lensSpecsItem.focalLengthMinMm}mm (Prime)`
                          : `${lensSpecsItem.focalLengthMinMm}mm - ${lensSpecsItem.focalLengthMaxMm}mm (Zoom)`}
                      </span>
                    </div>
                  )}

                {lensSpecsItem.hasStabilization !== null && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">
                      Image Stabilization
                    </span>
                    <span className="font-medium">
                      {lensSpecsItem.hasStabilization ? "Yes" : "No"}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

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
      <GearReviews slug={item.slug} />

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
