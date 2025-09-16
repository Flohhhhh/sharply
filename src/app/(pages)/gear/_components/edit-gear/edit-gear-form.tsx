"use client";

import { useState, useCallback } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { CoreFields } from "./fields-core";
import { LensFields } from "./fields-lenses";
import CameraFields from "./fields-cameras";
import type { gear, cameraSpecs, lensSpecs } from "~/server/db/schema";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatPrice, formatCardSlotDetails } from "~/lib/mapping";
import { sensorNameFromSlug } from "~/lib/mapping/sensor-map";
import { humanizeKey, formatHumanDate } from "~/lib/utils";
import { actionSubmitGearProposal } from "~/server/gear/actions";

interface EditGearFormProps {
  gearType?: "CAMERA" | "LENS";
  gearSlug: string;
  gearData: typeof gear.$inferSelect & {
    cameraSpecs?: typeof cameraSpecs.$inferSelect | null;
    lensSpecs?: typeof lensSpecs.$inferSelect | null;
  };
}

function EditGearForm({ gearType, gearData, gearSlug }: EditGearFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState(gearData);
  const [diffPreview, setDiffPreview] = useState<Record<string, any> | null>(
    null,
  );

  const handleChange = useCallback(
    (field: string, value: any, section?: string) => {
      if (section) {
        // Handle nested updates (e.g., cameraSpecs, lensSpecs)
        setFormData((prev) => ({
          ...prev,
          [section]: {
            ...(prev[section as keyof typeof prev] as Record<string, any>),
            [field]: value,
          },
        }));
      } else {
        // Handle direct gear field updates
        setFormData((prev) => ({
          ...prev,
          [field]: value,
        }));
      }
      // Mark form dirty on any change
      setIsDirty(true);
    },
    [],
  );

  // Helpers to compute diff-only payloads we can show and submit
  const equalish = (a: unknown, b: unknown): boolean => {
    if (Object.is(a, b)) return true;
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;

    // Arrays: shallow, order-sensitive equality for primitives
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!Object.is(a[i], b[i])) return false;
      }
      return true;
    }

    const toMs = (v: unknown): number | null => {
      if (v instanceof Date) return v.getTime();
      if (typeof v === "string") {
        const t = Date.parse(v);
        return Number.isNaN(t) ? null : t;
      }
      return null;
    };
    const aMs = toMs(a);
    const bMs = toMs(b);
    if (aMs !== null && bMs !== null) return aMs === bMs;

    const toNum = (v: unknown): number | null => {
      if (typeof v === "number" && Number.isFinite(v)) return v;
      if (
        typeof v === "string" &&
        v.trim() !== "" &&
        !Number.isNaN(Number(v))
      ) {
        return Number(v);
      }
      return null;
    };
    const aNum = toNum(a);
    const bNum = toNum(b);
    if (aNum !== null && bNum !== null) return aNum === bNum;

    return false;
  };

  const diffByKeys = (
    original: Record<string, any>,
    updated: Record<string, any>,
    keys: readonly string[],
  ) => {
    const out: Record<string, any> = {};
    for (const key of keys) {
      if (!(key in updated)) continue;
      const nextVal = (updated as any)[key];
      const prevVal = (original as any)[key];
      if (!equalish(prevVal, nextVal)) {
        out[key] = nextVal ?? null;
      }
    }
    return out;
  };

  const buildDiffPayload = (): Record<string, any> => {
    const payload: Record<string, any> = {};
    const coreKeys = [
      "name",
      "brandId",
      "mountId",
      "releaseDate",
      "msrpNowUsdCents",
      "msrpAtLaunchUsdCents",
      "mpbMaxPriceUsdCents",
      "weightGrams",
      "widthMm",
      "heightMm",
      "depthMm",
      "linkManufacturer",
      "linkMpb",
      "linkAmazon",
      "genres",
    ] as const;
    const coreDiff = diffByKeys(gearData as any, formData as any, coreKeys);
    if (Object.keys(coreDiff).length > 0) payload.core = coreDiff;

    if (formData.cameraSpecs) {
      const cameraKeys = [
        "sensorFormatId",
        "resolutionMp",
        "sensorStackingType",
        "sensorTechType",
        "isBackSideIlluminated",
        "sensorReadoutSpeedMs",
        "maxRawBitDepth",
        "isoMin",
        "isoMax",
        "hasIbis",
        "hasElectronicVibrationReduction",
        "cipaStabilizationRatingStops",
        "hasPixelShiftShooting",
        "hasAntiAliasingFilter",
        "processorName",
        "hasWeatherSealing",
        "focusPoints",
        "afAreaModes",
        "hasFocusPeaking",
        "hasFocusBracketing",
        "shutterSpeedMax",
        "shutterSpeedMin",
        "maxFpsRaw",
        "maxFpsJpg",
        "flashSyncSpeed",
        "hasSilentShootingAvailable",
        "availableShutterTypes",
        "cipaBatteryShotsPerCharge",
        "supportedBatteries",
        "usbCharging",
        "usbPowerDelivery",
        "hasLogColorProfile",
        "has10BitVideo",
        "has12BitVideo",
        "hasIntervalometer",
        "hasSelfTimer",
        "hasBuiltInFlash",
        "hasHotShoe",
      ] as const;
      const orig = (gearData.cameraSpecs ?? {}) as Record<string, any>;
      const diffs = diffByKeys(orig, formData.cameraSpecs as any, cameraKeys);
      if (Object.keys(diffs).length > 0) payload.camera = diffs;
    }

    if (formData.lensSpecs) {
      const lensKeys = [
        "isPrime",
        "focalLengthMinMm",
        "focalLengthMaxMm",
        "maxApertureWide",
        "maxApertureTele",
        "minApertureWide",
        "minApertureTele",
        "hasStabilization",
        "cipaStabilizationRatingStops",
        "hasStabilizationSwitch",
        "hasAutofocus",
        "isMacro",
        "magnification",
        "minimumFocusDistanceMm",
        "hasFocusRing",
        "focusMotorType",
        "hasAfMfSwitch",
        "hasFocusLimiter",
        "hasFocusRecallButton",
        "numberElements",
        "numberElementGroups",
        "hasDiffractiveOptics",
        "numberDiaphragmBlades",
        "hasRoundedDiaphragmBlades",
        "hasInternalZoom",
        "hasInternalFocus",
        "frontElementRotates",
        "mountMaterial",
        "hasWeatherSealing",
        "hasApertureRing",
        "numberCustomControlRings",
        "numberFunctionButtons",
        "acceptsFilterTypes",
        "frontFilterThreadSizeMm",
        "rearFilterThreadSizeMm",
        "dropInFilterSizeMm",
        "hasBuiltInTeleconverter",
        "hasLensHood",
        "hasTripodCollar",
      ] as const;

      // Submit-time safeguard: if focal-length min and max are equal, treat as prime
      const adjustedLensSpecs: Record<string, any> = {
        ...(formData.lensSpecs as any),
      };
      const minVal = Number((adjustedLensSpecs as any)?.focalLengthMinMm);
      const maxVal = Number((adjustedLensSpecs as any)?.focalLengthMaxMm);
      if (
        Number.isFinite(minVal) &&
        Number.isFinite(maxVal) &&
        minVal === maxVal
      ) {
        adjustedLensSpecs.isPrime = true;
        adjustedLensSpecs.focalLengthMinMm = minVal;
        adjustedLensSpecs.focalLengthMaxMm = maxVal;
      }

      const orig = (gearData.lensSpecs ?? {}) as Record<string, any>;
      const diffs = diffByKeys(orig, adjustedLensSpecs as any, lensKeys);
      if (Object.keys(diffs).length > 0) payload.lens = diffs;
    }

    // Top-level cameraCardSlots (first-class section)
    type NormalizedSlot = {
      slotIndex: number;
      supportedFormFactors: string[];
      supportedBuses: string[];
      supportedSpeedClasses: string[];
    };
    const normalizeSlots = (slots: unknown): NormalizedSlot[] => {
      if (!Array.isArray(slots)) return [] as NormalizedSlot[];
      const out: NormalizedSlot[] = slots
        .map((s: any): NormalizedSlot => {
          const rawIndex =
            typeof s?.slotIndex === "number"
              ? s.slotIndex
              : Number(s?.slotIndex ?? 0);
          const slotIndex =
            Number.isFinite(rawIndex) && rawIndex > 0
              ? Math.trunc(rawIndex)
              : 0;
          const supportedFormFactors = Array.isArray(s?.supportedFormFactors)
            ? [...s.supportedFormFactors]
                .filter((x: unknown): x is string => typeof x === "string")
                .sort()
            : [];
          const supportedBuses = Array.isArray(s?.supportedBuses)
            ? [...s.supportedBuses]
                .filter((x: unknown): x is string => typeof x === "string")
                .sort()
            : [];
          const supportedSpeedClasses = Array.isArray(s?.supportedSpeedClasses)
            ? [...s.supportedSpeedClasses]
                .filter((x: unknown): x is string => typeof x === "string")
                .sort()
            : [];
          return {
            slotIndex,
            supportedFormFactors,
            supportedBuses,
            supportedSpeedClasses,
          };
        })
        .filter((s) => s.slotIndex > 0)
        .sort((a, b) => a.slotIndex - b.slotIndex);
      return out;
    };

    const prevSlots = normalizeSlots((gearData as any).cameraCardSlots);
    const nextSlots = normalizeSlots((formData as any).cameraCardSlots);
    const slotsChanged =
      JSON.stringify(prevSlots) !== JSON.stringify(nextSlots);
    if (slotsChanged) {
      payload.cameraCardSlots = nextSlots;
    }
    return payload;
  };

  const doSubmit = async () => {
    setIsSubmitting(true);

    // Build diff-only payload: include only changed fields, and include nulls
    // when a value is explicitly cleared.
    const payload: Record<string, unknown> = buildDiffPayload();

    // Guard: no changes
    if (Object.keys(payload).length === 0) {
      toast.info("No changes to submit", {
        description: "Update a field before submitting.",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      console.log("[EditGearForm] submitting suggestion", {
        gearType,
        gearSlug,
        payload,
      });
      console.time(`[EditGearForm] submit ${gearSlug}`);

      const res = await actionSubmitGearProposal({ slug: gearSlug, payload });
      console.timeEnd(`[EditGearForm] submit ${gearSlug}`);
      if (res?.ok) {
        setIsDirty(false);
        const createdId = (res as any)?.proposal?.id;
        toast.success("Suggestion submitted", {
          description: "Thanks! We'll review it shortly.",
        });
        router.replace(`/edit-success?id=${createdId ?? ""}`);
      } else {
        toast.error("Failed to submit suggestion", {
          description: "Please try again in a moment.",
        });
      }
    } catch (err) {
      console.error("[EditGearForm] submit error", err);
      toast.error("Something went wrong", {
        description: "Could not submit your suggestion.",
      });
    }

    setIsSubmitting(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const preview = buildDiffPayload();
    // Prevent opening confirmation when nothing actually changed
    if (Object.keys(preview).length === 0) {
      toast.info("No changes to submit", {
        description: "Update a field before submitting.",
      });
      return;
    }
    setDiffPreview(preview);
    setConfirmOpen(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <CoreFields
        currentSpecs={
          {
            ...(formData as any),
            // Prefill strictly from current schema keys
            msrpNowUsdCents: (formData as any).msrpNowUsdCents ?? null,
            mpbMaxPriceUsdCents: (formData as any).mpbMaxPriceUsdCents ?? null,
            genres: Array.isArray((formData as any).genres)
              ? ((formData as any).genres as string[])
              : [],
          } as any
        }
        onChange={handleChange}
      />

      {/* TODO: Add gear-type-specific fields */}
      {gearType === "CAMERA" && (
        <CameraFields
          gearItem={formData}
          currentSpecs={formData.cameraSpecs}
          onChange={(field, value) => handleChange(field, value, "cameraSpecs")}
          onChangeTopLevel={(field, value) => handleChange(field, value)}
        />
      )}

      {gearType === "LENS" && (
        <LensFields
          currentSpecs={formData.lensSpecs}
          onChange={(field, value) => handleChange(field, value, "lensSpecs")}
        />
      )}

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
          loading={isSubmitting}
        >
          Continue
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit suggestion?</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit these changes for review? You will
              not be able to make adjustments or make a new change request until
              this one is reviewed by an admin.
            </DialogDescription>
          </DialogHeader>
          {/* Diff preview */}
          {diffPreview && (
            <div className="bg-muted/40 border-border mb-4 space-y-2 rounded-md border p-3 text-sm">
              {Object.keys(diffPreview).length === 0 ? (
                <p className="text-muted-foreground">No changes detected.</p>
              ) : (
                <>
                  {diffPreview.core && (
                    <div>
                      <div className="mb-1 font-medium">Core</div>
                      <ul className="list-disc pl-5">
                        {Object.entries(
                          diffPreview.core as Record<string, any>,
                        ).map(([k, v]) => {
                          let display: string = String(v);
                          if (
                            k === "msrpNowUsdCents" ||
                            k === "msrpAtLaunchUsdCents" ||
                            k === "mpbMaxPriceUsdCents"
                          )
                            display = formatPrice(v as number);
                          if (k === "releaseDate")
                            display = formatHumanDate(v as any);
                          return (
                            <li key={k}>
                              <span className="text-muted-foreground">
                                {humanizeKey(k)}:
                              </span>{" "}
                              <span className="font-medium">{display}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  {diffPreview.camera && (
                    <div>
                      <div className="mb-1 font-medium">Camera</div>
                      <ul className="list-disc pl-5">
                        {Object.entries(
                          diffPreview.camera as Record<string, any>,
                        ).map(([k, v]) => {
                          let display: string = String(v);
                          if (k === "sensorFormatId")
                            display = sensorNameFromSlug(v as string);
                          return (
                            <li key={k}>
                              <span className="text-muted-foreground">
                                {humanizeKey(k)}:
                              </span>{" "}
                              <span className="font-medium">{display}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  {diffPreview.lens && (
                    <div>
                      <div className="mb-1 font-medium">Lens</div>
                      <ul className="list-disc pl-5">
                        {Object.entries(
                          diffPreview.lens as Record<string, any>,
                        ).map(([k, v]) => (
                          <li key={k}>
                            <span className="text-muted-foreground">
                              {humanizeKey(k)}:
                            </span>{" "}
                            <span className="font-medium">{String(v)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray((diffPreview as any).cameraCardSlots) && (
                    <div>
                      <div className="mb-1 font-medium">Card Slots</div>
                      <ul className="list-disc pl-5">
                        {((diffPreview as any).cameraCardSlots as any[]).map(
                          (s, i) => (
                            <li key={i}>
                              <span className="text-muted-foreground">
                                Slot {s.slotIndex}:
                              </span>{" "}
                              <span className="font-medium">
                                {formatCardSlotDetails({
                                  slotIndex: Number(s?.slotIndex) || null,
                                  supportedFormFactors: Array.isArray(
                                    s?.supportedFormFactors,
                                  )
                                    ? (s.supportedFormFactors as string[])
                                    : [],
                                  supportedBuses: Array.isArray(
                                    s?.supportedBuses,
                                  )
                                    ? (s.supportedBuses as string[])
                                    : [],
                                  supportedSpeedClasses: Array.isArray(
                                    s?.supportedSpeedClasses,
                                  )
                                    ? (s.supportedSpeedClasses as string[])
                                    : [],
                                })}
                              </span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                setConfirmOpen(false);
                await doSubmit();
              }}
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Confirm Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}

export { EditGearForm };
export default EditGearForm;
