"use client";

import { useMemo, useRef, useState } from "react";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { EditGearForm } from "./edit-gear-form";
import type { GearItem } from "~/types/gear";
import { buildEditSidebarSections } from "~/lib/specs/registry";
import { Check, CheckCircle, Circle, ChevronRight } from "lucide-react";

interface Props {
  gearType?: "CAMERA" | "LENS";
  gearSlug: string;
  gearData: GearItem;
  initialShowMissingOnly?: boolean;
}

export default function EditGearClient({
  gearType,
  gearSlug,
  gearData,
  initialShowMissingOnly,
}: Props) {
  const [showMissingOnly, setShowMissingOnly] = useState(
    Boolean(initialShowMissingOnly),
  );
  const [isDirty, setIsDirty] = useState(false);

  const isFilled = (v: unknown): boolean => {
    if (v == null) return false;
    if (typeof v === "string") return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  };

  // Normalize item similar to modal (ensure mountIds array exists)
  const preparedData = useMemo(() => {
    const base = gearData as any;
    return {
      ...base,
      ...(typeof base.mountIds === "undefined" && {
        mountIds: base.mountId ? [base.mountId] : [],
      }),
    } as GearItem;
  }, [gearData]);

  const sidebarSections = useMemo(
    () => buildEditSidebarSections(preparedData),
    [preparedData],
  );
  const sidebarSectionsFiltered = useMemo(
    () => sidebarSections.filter((s) => s.id !== "notes"),
    [sidebarSections],
  );

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    sidebarSectionsFiltered.forEach((section) => {
      const hasFields = Array.isArray(section.fields) && section.fields.length;
      const allFilled = hasFields
        ? section.fields.every((f) => isFilled(f.rawValue))
        : false;
      initial[section.id] = hasFields ? !allFilled : true;
    });
    return initial;
  });
  const toggle = (k: string) => setExpanded((s) => ({ ...s, [k]: !s[k] }));

  // Scroll and focus to field/section
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const fieldKeyToElementId: Record<string, string> = useMemo(
    () => ({
      // Core
      msrpNowUsdCents: "msrpNow",
      msrpAtLaunchUsdCents: "msrpAtLaunch",
      mpbMaxPriceUsdCents: "mpbMaxPrice",
      widthMm: "widthMm",
      heightMm: "heightMm",
      depthMm: "depthMm",
      linkManufacturer: "linkManufacturer",
      linkMpb: "linkMpb",
      linkAmazon: "linkAmazon",
      // Camera
      sensorFormatId: "sensorFormatId",
      resolutionMp: "resolutionMp",
      sensorReadoutSpeedMs: "sensorReadoutSpeedMs",
      isoMin: "isoMin",
      isoMax: "isoMax",
      rearDisplayResolutionMillionDots: "rearDisplayResolutionMillionDots",
      rearDisplaySizeInches: "rearDisplaySizeInches",
      viewfinderMagnification: "viewfinderMagnification",
      viewfinderResolutionMillionDots: "viewfinderResolutionMillionDots",
      hasTopDisplay: "hasTopDisplay",
      hasRearTouchscreen: "hasRearTouchscreen",
      maxRawBitDepth: "maxRawBitDepth",
      hasIbis: "hasIbis",
      hasElectronicVibrationReduction: "hasElectronicVibrationReduction",
      cipaStabilizationRatingStops: "cipaStabilizationRatingStops",
      hasPixelShiftShooting: "hasPixelShiftShooting",
      hasAntiAliasingFilter: "hasAntiAliasingFilter",
      processorName: "processorName",
      focusPoints: "focusPoints",
      afAreaModes: "afAreaModes",
      hasFocusPeaking: "hasFocusPeaking",
      hasFocusBracketing: "hasFocusBracketing",
      shutterSpeedMax: "shutterSpeedMax",
      shutterSpeedMin: "shutterSpeedMin",
      maxFpsRaw: "maxFpsRaw",
      maxFpsJpg: "maxFpsJpg",
      flashSyncSpeed: "flashSyncSpeed",
      hasSilentShootingAvailable: "hasSilentShootingAvailable",
      availableShutterTypes: "availableShutterTypes",
      cipaBatteryShotsPerCharge: "cipaBatteryShotsPerCharge",
      supportedBatteries: "supportedBatteries",
      usbCharging: "usbCharging",
      usbPowerDelivery: "usbPowerDelivery",
      hasLogColorProfile: "hasLogColorProfile",
      has10BitVideo: "has10BitVideo",
      has12BitVideo: "has12BitVideo",
      hasIntervalometer: "hasIntervalometer",
      hasSelfTimer: "hasSelfTimer",
      hasBuiltInFlash: "hasBuiltInFlash",
      hasHotShoe: "hasHotShoe",
      // Lens
      focalLength: "focalLength",
      maxApertureWide: "aperture",
      maxApertureTele: "aperture",
      minApertureWide: "aperture",
      minApertureTele: "aperture",
      hasStabilization: "hasStabilization",
      hasStabilizationSwitch: "hasStabilizationSwitch",
      magnification: "magnification",
      minimumFocusDistanceMm: "minimumFocusDistanceMm",
      acceptsFilterTypes: "acceptsFilterTypes",
      frontFilterThreadSizeMm: "frontFilterThreadSizeMm",
      rearFilterThreadSizeMm: "rearFilterThreadSizeMm",
      dropInFilterSizeMm: "dropInFilterSizeMm",
    }),
    [],
  );

  const scrollToFieldOrSection = (sectionAnchor: string, fieldKey: string) => {
    const container = scrollContainerRef.current;
    const sectionId = sectionAnchor;
    const candidateId = fieldKeyToElementId[fieldKey] ?? fieldKey;
    const el = (document.getElementById(candidateId) ||
      document.getElementById(sectionId)) as HTMLElement | null;
    if (!el) return;
    const headerOffset = 80; // page header spacing
    if (container) {
      const containerTop = container.getBoundingClientRect().top;
      const targetTop = el.getBoundingClientRect().top;
      const offset =
        targetTop - containerTop + container.scrollTop - headerOffset;
      container.scrollTo({ top: offset, behavior: "smooth" });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.scrollBy({ top: -headerOffset, left: 0, behavior: "auto" });
    }
  };

  return (
    <div className="flex flex-col">
      <div className="border-b p-3">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-lg font-semibold">Edit Gear Item</h1>
          <div className="flex items-center gap-4">
            <span
              className={`inline-flex items-center gap-1.5 text-xs ${isDirty ? "opacity-100" : "opacity-0"}`}
              aria-live="polite"
            >
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Unsaved</span>
            </span>
            <div className="flex items-center gap-2">
              <Label htmlFor="show-missing-only">Show missing only</Label>
              <Switch
                id="show-missing-only"
                checked={showMissingOnly}
                onCheckedChange={setShowMissingOnly}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 md:grid-cols-[260px_1fr]">
        <aside className="border-border/60 hidden border-r md:block">
          <div className="sticky top-24">
            <div className="h-[calc(100vh-6rem)] overflow-y-auto p-3 pb-24">
              <div className="mb-2 font-semibold">
                {gearData.name || gearSlug}
              </div>
              <nav className="space-y-1">
                {sidebarSectionsFiltered.map((section) => {
                  const allFilled =
                    Array.isArray(section.fields) &&
                    section.fields.length > 0 &&
                    section.fields.every((f) => isFilled(f.rawValue));
                  const fieldsSorted = Array.isArray(section.fields)
                    ? [...section.fields].sort((a, b) =>
                        String(a.label).localeCompare(String(b.label)),
                      )
                    : [];
                  const fieldsToRender = showMissingOnly
                    ? fieldsSorted.filter((f) => !isFilled(f.rawValue))
                    : fieldsSorted;
                  if (showMissingOnly && fieldsToRender.length === 0)
                    return null;
                  return (
                    <div key={section.id} className="space-y-1">
                      <button
                        type="button"
                        className="hover:bg-accent/40 flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-sm"
                        onClick={() => toggle(section.id)}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <ChevronRight
                            className={`h-3.5 w-3.5 flex-shrink-0 transition-transform ${expanded[section.id] ? "rotate-90" : "rotate-0"}`}
                          />
                          <span className="truncate">{section.title}</span>
                        </span>
                        {allFilled ? (
                          <Check className="text-muted-foreground h-3.5 w-3.5" />
                        ) : null}
                      </button>
                      {expanded[section.id] && (
                        <div className="ml-5 space-y-0.5">
                          {fieldsToRender.map((field) => (
                            <button
                              key={field.key}
                              type="button"
                              onClick={() =>
                                scrollToFieldOrSection(
                                  section.anchor,
                                  field.key,
                                )
                              }
                              className="text-muted-foreground hover:text-foreground flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs"
                            >
                              {isFilled(field.rawValue) ? (
                                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <Circle className="text-muted-foreground h-3.5 w-3.5" />
                              )}
                              <span className="truncate">{field.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          </div>
        </aside>
        <div className="p-6 pb-36">
          <EditGearForm
            gearType={gearType}
            gearData={gearData as any}
            gearSlug={gearSlug}
            showMissingOnly={showMissingOnly}
            onDirtyChange={setIsDirty}
          />
        </div>
      </div>
    </div>
  );
}
