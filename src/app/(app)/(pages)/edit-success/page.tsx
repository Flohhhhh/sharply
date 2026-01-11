import Link from "next/link";
import { fetchGearEditById } from "~/server/gear/service";
import { formatPrice, formatPrecaptureSupport } from "~/lib/mapping";
import { sensorNameFromSlug } from "~/lib/mapping/sensor-map";
import { humanizeKey, formatHumanDate } from "~/lib/utils";
import { auth } from "~/auth";
import { requireRole } from "~/lib/auth/auth-helpers";
import type { Metadata } from "next";
import { VideoSpecsSummary } from "~/app/(app)/(pages)/gear/_components/video/video-summary";
import { buildVideoDisplayBundle } from "~/lib/video/transform";
import {
  type VideoModeNormalized,
  normalizedToCameraVideoModes,
} from "~/lib/video/mode-schema";
import {
  formatAnalogCameraType,
  formatAnalogMedium,
  formatAnalogFilmTransport,
  formatAnalogViewfinderType,
  formatAnalogShutterType,
  formatAnalogMeteringMode,
  formatAnalogMeteringDisplay,
  formatAnalogExposureMode,
  formatAnalogIsoSettingMethod,
  formatAnalogFocusAid,
} from "~/lib/mapping/analog-types-map";
import { headers } from "next/headers";

const describeUnknownValue = (value: unknown): string => {
  if (value == null) return "Empty";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(describeUnknownValue).join(", ");
  }
  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable value]";
  }
};

const formatStorageForDisplay = (value: unknown): string | undefined => {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return undefined;
  if (num >= 1000) {
    const tb = num / 1000;
    const formattedTb = Number.isInteger(tb) ? tb.toFixed(0) : tb.toFixed(1);
    return `${formattedTb} TB`;
  }
  const formattedGb = Number.isInteger(num) ? num.toFixed(0) : num.toFixed(1);
  return `${formattedGb} GB`;
};

export const metadata: Metadata = {
  title: "Edit Submitted",
  openGraph: {
    title: "Edit Submitted",
  },
};

interface EditSuccessPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function EditSuccessPage({
  searchParams,
}: EditSuccessPageProps) {
  const { id } = await searchParams;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = session?.user;
  const isAdmin = requireRole(user, ["ADMIN"]);

  if (!id) {
    return (
      <div className="container mx-auto mt-24 min-h-screen max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Submission received</h1>
        <p className="text-muted-foreground mt-2">
          Your suggestion was submitted. We couldn't find an edit id in the URL,
          but you can go back to browsing.
        </p>
        <div className="mt-6">
          <Link href="/" className="text-primary text-sm">
            ← Back to home
          </Link>
          {isAdmin ? (
            <div className="mt-2">
              <Link href="/admin" className="text-primary text-sm">
                → Open admin
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  const edit = await fetchGearEditById(id);
  const videoModesPayload = Array.isArray((edit?.payload as any)?.videoModes)
    ? ((edit?.payload as any).videoModes as VideoModeNormalized[])
    : [];
  const videoSummaryBundle =
    videoModesPayload.length > 0
      ? buildVideoDisplayBundle(normalizedToCameraVideoModes(videoModesPayload))
      : null;

  return (
    <div className="container mx-auto mt-24 min-h-screen max-w-3xl p-6">
      <div className="mb-6">
        {edit?.gearSlug ? (
          <Link
            href={`/gear/${edit.gearSlug}`}
            className="text-primary text-sm"
          >
            ← Back to {edit.gearName}
          </Link>
        ) : (
          <Link href="/" className="text-primary text-sm">
            ← Back to home
          </Link>
        )}
      </div>

      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Thanks for your suggestion!</h1>
        <p className="text-muted-foreground">Submission ID: {id}</p>
        {edit?.status ? (
          <p className="text-muted-foreground">Current status: {edit.status}</p>
        ) : null}
        {edit?.status === "PENDING" && (
          <p className="text-muted-foreground">
            Your submission has been queued for review by our moderators. You’ll
            be notified if it’s approved or if we need more details.
          </p>
        )}
        {edit?.status === "APPROVED" && (
          <p className="text-muted-foreground">
            Your suggestion was approved and applied to the gear page. Thank you
            for contributing!
          </p>
        )}
        {edit?.status === "REJECTED" && (
          <p className="text-muted-foreground">
            Your suggestion was reviewed but not approved. You can submit
            another update from the gear page.
          </p>
        )}
        {edit?.status === "MERGED" && (
          <p className="text-muted-foreground">
            This submission was merged into another approved edit for the same
            gear.
          </p>
        )}

        {/* Payload preview */}
        {!!edit?.payload && (
          <div className="bg-muted/40 border-border space-y-4 rounded-md border p-3 text-sm">
            {Object.keys(edit.payload as any).length === 0 ? (
              <p className="text-muted-foreground">No changes detected.</p>
            ) : (
              <>
                {videoSummaryBundle && (
                  <div>
                    <div className="mb-1 font-medium">Video Summary</div>
                    <VideoSpecsSummary
                      summaryLines={videoSummaryBundle.summaryLines}
                      matrix={videoSummaryBundle.matrix}
                      codecLabels={videoSummaryBundle.codecLabels}
                      enableDetailHover
                    />
                  </div>
                )}
                {(edit.payload as any).core && (
                  <div>
                    <div className="mb-1 font-medium">Core</div>
                    <ul className="list-disc pl-5">
                      {Object.entries((edit.payload as any).core).map(
                        ([k, v]) => {
                          let display: string = String(v as any);
                          if (
                            k === "msrpUsdCents" ||
                            k === "msrpNowUsdCents" ||
                            k === "msrpAtLaunchUsdCents"
                          )
                            display = formatPrice(v as number);
                          if (k === "releaseDate")
                            display = formatHumanDate(v as any);
                          return (
                            <li key={String(k)}>
                              <span className="text-muted-foreground">
                                {humanizeKey(String(k))}:
                              </span>{" "}
                              <span className="font-medium">{display}</span>
                            </li>
                          );
                        },
                      )}
                    </ul>
                  </div>
                )}
                {(edit.payload as any).analogCamera && (
                  <div>
                    <div className="mb-1 font-medium">Analog Camera</div>
                    <ul className="list-disc pl-5">
                      {Object.entries(
                        (edit.payload as any).analogCamera as Record<
                          string,
                          unknown
                        >,
                      ).map(([k, v]) => {
                        let display: string | undefined;
                        if (k === "cameraType")
                          display = formatAnalogCameraType(v as string);
                        else if (k === "captureMedium")
                          display = formatAnalogMedium(v as string);
                        else if (k === "filmTransportType")
                          display = formatAnalogFilmTransport(v as string);
                        else if (k === "viewfinderType")
                          display = formatAnalogViewfinderType(v as string);
                        else if (k === "shutterType")
                          display = formatAnalogShutterType(v as string);
                        else if (k === "isoSettingMethod")
                          display = formatAnalogIsoSettingMethod(v as string);
                        else if (k === "meteringModes" && Array.isArray(v))
                          display = (v as string[])
                            .map((m) => formatAnalogMeteringMode(m) ?? m)
                            .join(", ");
                        else if (
                          k === "meteringDisplayTypes" &&
                          Array.isArray(v)
                        )
                          display = (v as string[])
                            .map((m) => formatAnalogMeteringDisplay(m) ?? m)
                            .join(", ");
                        else if (k === "exposureModes" && Array.isArray(v))
                          display = (v as string[])
                            .map((m) => formatAnalogExposureMode(m) ?? m)
                            .join(", ");
                        else if (k === "focusAidTypes" && Array.isArray(v))
                          display = (v as string[])
                            .map((m) => formatAnalogFocusAid(m) ?? m)
                            .join(", ");
                        if (display === undefined)
                          display = describeUnknownValue(v);
                        return (
                          <li key={String(k)}>
                            <span className="text-muted-foreground">
                              {humanizeKey(String(k))}:
                            </span>{" "}
                            <span className="font-medium">{display}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {(edit.payload as any).camera && (
                  <div>
                    <div className="mb-1 font-medium">Camera</div>
                    <ul className="list-disc pl-5">
                      {Object.entries((edit.payload as any).camera).map(
                        ([k, v]) => {
                          let display: string = String(v as any);
                          if (k === "sensorFormatId")
                            display = sensorNameFromSlug(v as string);
                          if (k === "precaptureSupportLevel") {
                            display =
                              formatPrecaptureSupport(v) ??
                              describeUnknownValue(v);
                          }
                          if (k === "internalStorageGb") {
                            display =
                              formatStorageForDisplay(v) ??
                              describeUnknownValue(v);
                          }
                          return (
                            <li key={String(k)}>
                              <span className="text-muted-foreground">
                                {humanizeKey(String(k))}:
                              </span>{" "}
                              <span className="font-medium">{display}</span>
                            </li>
                          );
                        },
                      )}
                    </ul>
                  </div>
                )}
                {(edit.payload as any).lens && (
                  <div>
                    <div className="mb-1 font-medium">Lens</div>
                    <ul className="list-disc pl-5">
                      {Object.entries((edit.payload as any).lens).map(
                        ([k, v]) => (
                          <li key={String(k)}>
                            <span className="text-muted-foreground">
                              {String(k)}:
                            </span>{" "}
                            <span className="font-medium">{String(v)}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
                {(edit.payload as any).fixedLens && (
                  <div>
                    <div className="mb-1 font-medium">Fixed Lens</div>
                    <ul className="list-disc pl-5">
                      {Object.entries((edit.payload as any).fixedLens).map(
                        ([k, v]) => (
                          <li key={String(k)}>
                            <span className="text-muted-foreground">
                              {humanizeKey(String(k))}:
                            </span>{" "}
                            <span className="font-medium">{String(v)}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
                {Array.isArray((edit.payload as any).cameraCardSlots) && (
                  <div>
                    <div className="mb-1 font-medium">Card Slots</div>
                    <ul className="list-disc pl-5">
                      {((edit.payload as any).cameraCardSlots as any[]).map(
                        (s, i) => {
                          const ff = Array.isArray(s.supportedFormFactors)
                            ? (s.supportedFormFactors as string[]).join(", ")
                            : "";
                          const buses = Array.isArray(s.supportedBuses)
                            ? (s.supportedBuses as string[]).join(", ")
                            : "";
                          const speeds = Array.isArray(s.supportedSpeedClasses)
                            ? (s.supportedSpeedClasses as string[]).join(", ")
                            : "";
                          const details = [ff, buses, speeds]
                            .filter(Boolean)
                            .join(" | ");
                          return (
                            <li key={i}>
                              <span className="text-muted-foreground">
                                Slot {s.slotIndex}:
                              </span>{" "}
                              <span className="font-medium">{details}</span>
                            </li>
                          );
                        },
                      )}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <ul className="text-muted-foreground list-disc pl-6">
          {edit?.status === "PENDING" && (
            <li>Edits are typically reviewed within 24–72 hours.</li>
          )}
          <li>You can continue browsing; this page is safe to close.</li>
          <li>
            Want to help more? Submit additional edits from the gear page
            anytime.
          </li>
        </ul>

        {edit?.gearSlug && (
          <div className="pt-2">
            <Link
              href={`/gear/${edit.gearSlug}${edit?.gearType ? `#suggest` : ""}`}
              className="text-primary text-sm"
            >
              Go to gear page
            </Link>
          </div>
        )}
        {isAdmin ? (
          <div className="pt-2">
            <Link href="/admin" className="text-primary text-sm">
              Open admin dashboard
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
