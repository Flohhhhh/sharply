import { db } from "~/server/db";
import { auth, signIn } from "~/server/auth";
import Link from "next/link";
import {
  cameraSpecs,
  lensSpecs,
  sensorFormats,
  gearEdits,
} from "~/server/db/schema";
import { and, eq } from "drizzle-orm";
import { formatPrice, getMountDisplayName } from "~/lib/mapping";
import { formatHumanDate, getConstructionState } from "~/lib/utils";
import { GearActionButtons } from "~/app/(pages)/gear/_components/gear-action-buttons";
import { GearVisitTracker } from "~/app/(pages)/gear/_components/gear-visit-tracker";
import { GearReviewForm } from "~/app/(pages)/gear/_components/gear-review-form";
import { GearReviewsList } from "~/app/(pages)/gear/_components/gear-reviews-list";
import { fetchGearBySlug } from "~/lib/queries/gear";
import { ConstructionNotice } from "~/app/(pages)/gear/_components/construction-notice";
import { ConstructionFullPage } from "~/app/(pages)/gear/_components/construction-full";
import type { GearItem } from "~/types/gear";
import { GearContributors } from "~/app/(pages)/gear/_components/gear-contributors";

interface GearPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function GearPage({ params }: GearPageProps) {
  const { slug } = await params;

  // Fetch core gear data
  const item: GearItem = await fetchGearBySlug(slug);
  const session = await auth();
  const isLoggedIn = !!session?.user;

  // Fetch additional specs that aren't in the core helper yet
  const [cameraSpecsData, lensSpecsData] = await Promise.all([
    db
      .select({
        sensorFormatId: cameraSpecs.sensorFormatId,
        resolutionMp: cameraSpecs.resolutionMp,
        isoMin: cameraSpecs.isoMin,
        isoMax: cameraSpecs.isoMax,
        maxFpsRaw: cameraSpecs.maxFpsRaw,
        maxFpsJpg: cameraSpecs.maxFpsJpg,
        extra: cameraSpecs.extra,
      })
      .from(cameraSpecs)
      .where(eq(cameraSpecs.gearId, item.id))
      .limit(1),
    db
      .select({
        focalLengthMinMm: lensSpecs.focalLengthMinMm,
        focalLengthMaxMm: lensSpecs.focalLengthMaxMm,
        hasStabilization: lensSpecs.hasStabilization,
        extra: lensSpecs.extra,
      })
      .from(lensSpecs)
      .where(eq(lensSpecs.gearId, item.id))
      .limit(1),
  ]);

  // Get sensor format if camera specs exist
  let sensorFormat = null;
  if (cameraSpecsData.length > 0 && cameraSpecsData[0]?.sensorFormatId) {
    const sensorFormatData = await db
      .select({
        id: sensorFormats.id,
        name: sensorFormats.name,
        slug: sensorFormats.slug,
      })
      .from(sensorFormats)
      .where(eq(sensorFormats.id, cameraSpecsData[0].sensorFormatId))
      .limit(1);

    if (sensorFormatData.length > 0) {
      sensorFormat = sensorFormatData[0];
    }
  }

  const cameraSpecsItem = cameraSpecsData[0] || null;
  const lensSpecsItem = lensSpecsData[0] || null;

  // Under construction state
  const construction = getConstructionState({
    gearType: item.gearType,
    gearName: item.name,
    brandId: item.brandId ?? null,
    mountId: item.mountId ?? null,
    camera:
      item.gearType === "CAMERA"
        ? {
            sensorFormatId: cameraSpecsItem?.sensorFormatId ?? null,
            resolutionMp: Number(cameraSpecsItem?.resolutionMp ?? null) || null,
          }
        : null,
    lens:
      item.gearType === "LENS"
        ? {
            focalLengthMinMm: lensSpecsItem?.focalLengthMinMm ?? null,
            focalLengthMaxMm: lensSpecsItem?.focalLengthMaxMm ?? null,
            maxAperture: (lensSpecsItem as any)?.maxAperture ?? null,
          }
        : null,
  });

  if (construction.underConstruction) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <ConstructionFullPage
          gearName={item.name}
          missing={construction.missing}
          editHref={`/gear/${item.slug}/edit?type=${item.gearType}`}
          isLoggedIn={isLoggedIn}
        />
      </main>
    );
  }

  // Find any pending edit for this gear created by the current user
  const userPendingEdit = isLoggedIn
    ? await db
        .select({ id: gearEdits.id })
        .from(gearEdits)
        .where(
          and(
            eq(gearEdits.gearId, item.id),
            eq(gearEdits.createdById, session!.user!.id),
            eq(gearEdits.status, "PENDING"),
          ),
        )
        .limit(1)
    : [];
  const hasPendingEdit = userPendingEdit.length > 0;
  const pendingEditId = userPendingEdit[0]?.id;

  return (
    <main className="mx-auto max-w-4xl p-6">
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

      {/* Pending submission banner (only for this user and only when pending) */}
      {isLoggedIn && hasPendingEdit && (
        <div className="border-border bg-muted/50 text-muted-foreground mb-6 rounded-md border px-4 py-3 text-sm">
          You have a recent suggestion pending review.{" "}
          <Link
            href={`/edit-success?id=${pendingEditId}`}
            className="text-primary underline"
          >
            View submission
          </Link>
          .
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-8">
        <GearActionButtons slug={slug} />
      </div>

      {/* Suggest Edit Button (only when logged in) */}
      {isLoggedIn && (
        <div className="mb-6">
          {hasPendingEdit ? (
            <Link
              scroll={false}
              href={`/edit-success?id=${pendingEditId}`}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
            >
              Submission Pending
            </Link>
          ) : (
            <Link
              scroll={false}
              href={`/gear/${item.slug}/edit?type=${item.gearType}`}
              className="bg-primary hover:bg-primary/90 text-primary-foreground inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
            >
              Suggest Edit
            </Link>
          )}
        </div>
      )}

      {/* Specifications */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Specifications</h2>
          {isLoggedIn &&
            (hasPendingEdit ? (
              <Link
                scroll={false}
                href={`/edit-success?id=${pendingEditId}`}
                className="bg-muted text-muted-foreground hover:bg-muted/80 inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
              >
                Submission Pending
              </Link>
            ) : (
              <Link
                scroll={false}
                href={`/gear/${item.slug}/edit?type=${item.gearType}`}
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
              >
                Suggest Edit
              </Link>
            ))}
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

      {/* Sign-in CTA banner for editing specs (visible only when signed out) */}
      {!isLoggedIn && (
        <div className="border-border bg-muted/60 text-muted-foreground my-8 rounded-md border px-4 py-3 text-sm">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <span className="block">Want to help improve these specs?</span>
              <span className="block text-xs opacity-90">
                Sharply gear specs are crowdsourced by the community. Your edits
                are reviewed for accuracy before they go live.
              </span>
            </div>
            <Link
              href="/api/auth/signin"
              className="bg-primary hover:bg-primary/90 text-primary-foreground inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
            >
              Sign in to edit specs
            </Link>
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="mt-12">
        <h2 className="mb-4 text-lg font-semibold">Reviews</h2>
        <GearReviewForm gearSlug={item.slug} />
        <GearReviewsList gearSlug={item.slug} />
      </div>

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
