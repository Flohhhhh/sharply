import Link from "next/link";
import { eq } from "drizzle-orm";
import {
  formatPrice,
  getMountDisplayName,
  formatDimensions,
} from "~/lib/mapping";
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
import { sensorTypeLabel } from "~/lib/mapping/sensor-map";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { SpecsMissingNote } from "../_components/specs-missing-note";

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

  // Specs (strongly typed via schema); avoid manual field mapping
  const cameraSpecsItem =
    item.gearType === "CAMERA" ? (item.cameraSpecs ?? null) : null;
  const lensSpecsItem =
    item.gearType === "LENS" ? (item.lensSpecs ?? null) : null;

  // console.log("[GearPage] cameraSpecsItem", cameraSpecsItem);

  // Get sensor format if camera specs exist
  let sensorFormat = null;
  // sensor format id available on camera specs; join for name elsewhere
  if (cameraSpecsItem?.sensorFormatId) {
    sensorFormat = {
      id: cameraSpecsItem.sensorFormatId,
      name: "",
      slug: "",
    } as any;
  }

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
                      {Number(cameraSpecsItem.resolutionMp).toFixed(1)}{" "}
                      megapixels
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

                {sensorTypeLabel && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">Sensor Type</span>
                    <span className="font-medium">
                      {sensorTypeLabel(cameraSpecsItem)}
                    </span>
                  </div>
                )}

                {cameraSpecsItem.hasIbis !== null &&
                  cameraSpecsItem.hasIbis !== undefined && (
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-muted-foreground flex items-center gap-2">
                        Has IBIS{" "}
                        <Tooltip>
                          <TooltipTrigger>
                            <InfoIcon className="text-muted-foreground h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>In-body image stabilization</p>
                          </TooltipContent>
                        </Tooltip>
                      </span>
                      <span className="font-medium">
                        {cameraSpecsItem.hasIbis ? "Yes" : "No"}
                      </span>
                    </div>
                  )}

                {cameraSpecsItem.hasElectronicVibrationReduction !== null &&
                  cameraSpecsItem.hasElectronicVibrationReduction !==
                    undefined && (
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-muted-foreground flex items-center gap-2">
                        Has Electronic VR{" "}
                        <Tooltip>
                          <TooltipTrigger>
                            <InfoIcon className="text-muted-foreground h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Digital image stabilization.</p>
                          </TooltipContent>
                        </Tooltip>
                      </span>
                      <span className="font-medium">
                        {cameraSpecsItem.hasElectronicVibrationReduction
                          ? "Yes"
                          : "No"}
                      </span>
                    </div>
                  )}

                {cameraSpecsItem.cipaStabilizationRatingStops && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">
                      CIPA Stabilization Rating Stops
                    </span>
                    <span className="font-medium">
                      {cameraSpecsItem.cipaStabilizationRatingStops} stops
                    </span>
                  </div>
                )}

                {cameraSpecsItem.hasPixelShiftShooting !== null &&
                  cameraSpecsItem.hasPixelShiftShooting !== undefined && (
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-muted-foreground">
                        Has Pixel Shift Shooting
                      </span>
                      <span className="font-medium">
                        {cameraSpecsItem.hasPixelShiftShooting ? "Yes" : "No"}
                      </span>
                    </div>
                  )}

                {cameraSpecsItem.hasAntiAliasingFilter !== null &&
                  cameraSpecsItem.hasAntiAliasingFilter !== undefined && (
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-muted-foreground">
                        Has Anti Aliasing Filter
                      </span>
                      <span className="font-medium">
                        {cameraSpecsItem.hasAntiAliasingFilter ? "Yes" : "No"}
                      </span>
                    </div>
                  )}

                {(cameraSpecsItem.widthMm != null ||
                  cameraSpecsItem.heightMm != null ||
                  cameraSpecsItem.depthMm != null) &&
                  (() => {
                    const dims = formatDimensions({
                      widthMm:
                        typeof cameraSpecsItem.widthMm === "number"
                          ? cameraSpecsItem.widthMm
                          : cameraSpecsItem.widthMm != null
                            ? Number(cameraSpecsItem.widthMm)
                            : null,
                      heightMm:
                        typeof cameraSpecsItem.heightMm === "number"
                          ? cameraSpecsItem.heightMm
                          : cameraSpecsItem.heightMm != null
                            ? Number(cameraSpecsItem.heightMm)
                            : null,
                      depthMm:
                        typeof cameraSpecsItem.depthMm === "number"
                          ? cameraSpecsItem.depthMm
                          : cameraSpecsItem.depthMm != null
                            ? Number(cameraSpecsItem.depthMm)
                            : null,
                    });
                    return dims ? (
                      <div className="flex justify-between px-4 py-3">
                        <span className="text-muted-foreground">
                          Dimensions
                        </span>
                        <span className="font-medium">{dims}</span>
                      </div>
                    ) : null;
                  })()}
                {cameraSpecsItem.processorName && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">
                      Processor Name
                    </span>
                    <span className="font-medium">
                      {cameraSpecsItem.processorName}
                    </span>
                  </div>
                )}
                {cameraSpecsItem.hasWeatherSealing !== null &&
                  cameraSpecsItem.hasWeatherSealing !== undefined && (
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-muted-foreground">
                        Weather Sealed
                      </span>
                      <span className="font-medium">
                        {cameraSpecsItem.hasWeatherSealing ? "Yes" : "No"}
                      </span>
                    </div>
                  )}
                {cameraSpecsItem.focusPoints && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">Focus Points</span>
                    <span className="font-medium">
                      {cameraSpecsItem.focusPoints}
                    </span>
                  </div>
                )}
                {cameraSpecsItem.afAreaModes && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">AF Area Modes</span>
                    <ul className="list-disc pl-5 text-sm">
                      {cameraSpecsItem.afAreaModes.map((mode) => (
                        <li key={mode.id}>{mode.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {cameraSpecsItem.hasFocusPeaking !== null &&
                  cameraSpecsItem.hasFocusPeaking !== undefined && (
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-muted-foreground">
                        Has Focus Peaking
                      </span>
                      <span className="font-medium">
                        {cameraSpecsItem.hasFocusPeaking ? "Yes" : "No"}
                      </span>
                    </div>
                  )}
                {cameraSpecsItem.hasFocusBracketing !== null &&
                  cameraSpecsItem.hasFocusBracketing !== undefined && (
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-muted-foreground">
                        Has Focus Bracketing
                      </span>
                      <span className="font-medium">
                        {cameraSpecsItem.hasFocusBracketing ? "Yes" : "No"}
                      </span>
                    </div>
                  )}
                {cameraSpecsItem.shutterSpeedMax && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">
                      Longest Shutter Speed
                    </span>
                    <span className="font-medium">
                      {cameraSpecsItem.shutterSpeedMax} sec.
                    </span>
                  </div>
                )}
                {/* TODO: should split this based on shutter types */}
                {cameraSpecsItem.shutterSpeedMin && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">
                      Fastest Shutter Speed
                    </span>
                    <span className="font-medium">
                      1/{cameraSpecsItem.shutterSpeedMin}s
                    </span>
                  </div>
                )}
                {cameraSpecsItem.flashSyncSpeed && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">
                      Flash Sync Speed
                    </span>
                    <span className="font-medium">
                      1/{cameraSpecsItem.flashSyncSpeed}s
                    </span>
                  </div>
                )}
                {cameraSpecsItem.hasSilentShootingAvailable !== null &&
                  cameraSpecsItem.hasSilentShootingAvailable !== undefined && (
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-muted-foreground">
                        Has Silent Shooting Available
                      </span>
                      <span className="font-medium">
                        {cameraSpecsItem.hasSilentShootingAvailable
                          ? "Yes"
                          : "No"}
                      </span>
                    </div>
                  )}
                {cameraSpecsItem.availableShutterTypes && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">
                      Available Shutter Types
                    </span>
                    <ul className="list-disc pl-5 text-sm">
                      {cameraSpecsItem.availableShutterTypes.map((type) => (
                        <li key={type}>{type}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {cameraSpecsItem.cipaBatteryShotsPerCharge && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">
                      CIPA Battery Shots Per Charge
                    </span>
                    <span className="font-medium">
                      {cameraSpecsItem.cipaBatteryShotsPerCharge} shots
                    </span>
                  </div>
                )}
                {cameraSpecsItem.supportedBatteries && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">
                      Supported Batteries
                    </span>
                    <ul className="list-disc pl-5 text-sm">
                      {cameraSpecsItem.supportedBatteries.map(
                        (battery: string) => (
                          <li key={battery}>{battery}</li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
                {cameraSpecsItem.usbCharging !== null &&
                  cameraSpecsItem.usbCharging !== undefined && (
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-muted-foreground">
                        USB Charging
                      </span>
                      <span className="font-medium">
                        {cameraSpecsItem.usbCharging ? "Yes" : "No"}
                      </span>
                    </div>
                  )}
                {cameraSpecsItem.usbPowerDelivery !== null &&
                  cameraSpecsItem.usbPowerDelivery !== undefined && (
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-muted-foreground">
                        USB Power Delivery
                      </span>
                      <span className="font-medium">
                        {cameraSpecsItem.usbPowerDelivery ? "Yes" : "No"}
                      </span>
                    </div>
                  )}
                {cameraSpecsItem.hasLogColorProfile !== null &&
                  cameraSpecsItem.hasLogColorProfile !== undefined && (
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-muted-foreground">
                        Log Color Profiles Available
                      </span>
                      <span className="font-medium">
                        {cameraSpecsItem.hasLogColorProfile ? "Yes" : "No"}
                      </span>
                    </div>
                  )}
                {cameraSpecsItem.has10BitVideo !== null &&
                  cameraSpecsItem.has10BitVideo !== undefined && (
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-muted-foreground">
                        Has 10 Bit Video
                      </span>
                      <span className="font-medium">
                        {cameraSpecsItem.has10BitVideo ? "Yes" : "No"}
                      </span>
                    </div>
                  )}
                {cameraSpecsItem.has12BitVideo !== null &&
                  cameraSpecsItem.has12BitVideo !== undefined && (
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-muted-foreground">
                        Has 12 Bit Video
                      </span>
                      <span className="font-medium">
                        {cameraSpecsItem.has12BitVideo ? "Yes" : "No"}
                      </span>
                    </div>
                  )}
                {cameraSpecsItem.hasIntervalometer !== null &&
                  cameraSpecsItem.hasIntervalometer !== undefined && (
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-muted-foreground">
                        Has Intervalometer
                      </span>
                      <span className="font-medium">
                        {cameraSpecsItem.hasIntervalometer ? "Yes" : "No"}
                      </span>
                    </div>
                  )}
                {cameraSpecsItem.hasSelfTimer !== null &&
                  cameraSpecsItem.hasSelfTimer !== undefined && (
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-muted-foreground">
                        Has Self Timer
                      </span>
                      <span className="font-medium">
                        {cameraSpecsItem.hasSelfTimer ? "Yes" : "No"}
                      </span>
                    </div>
                  )}
                {cameraSpecsItem.hasBuiltInFlash !== null &&
                  cameraSpecsItem.hasBuiltInFlash !== undefined && (
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-muted-foreground">
                        Has Built In Flash
                      </span>
                      <span className="font-medium">
                        {cameraSpecsItem.hasBuiltInFlash ? "Yes" : "No"}
                      </span>
                    </div>
                  )}
                {cameraSpecsItem.hasHotShoe !== null &&
                  cameraSpecsItem.hasHotShoe !== undefined && (
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-muted-foreground">
                        Has Hot Shoe
                      </span>
                      <span className="font-medium">
                        {cameraSpecsItem.hasHotShoe ? "Yes" : "No"}
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

                {lensSpecsItem.hasStabilization !== null &&
                  lensSpecsItem.hasStabilization !== undefined && (
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
          {/* number of missing specs with inline "sign in to contribute" or "help improve this item" */}
          <SpecsMissingNote item={item} />
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
