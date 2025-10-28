"use client";

import { useMemo, useRef, useState } from "react";
import { DialogClose, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { EditGearForm } from "./edit-gear-form";
import {
  Check,
  CheckCircle,
  Circle,
  ChevronRight,
  ArrowRight,
  X,
  ArrowLeft,
} from "lucide-react";
import type { GearItem } from "~/types/gear";
import { buildEditSidebarSections } from "~/lib/specs/registry";
import { Button } from "~/components/ui/button";

interface EditModalContentProps {
  gearType?: "CAMERA" | "LENS";
  gearSlug: string;
  gearName?: string;
  gearData: GearItem;
  onDirtyChange?: (dirty: boolean) => void;
  onRequestClose: (opts?: { force?: boolean }) => void;
  initialShowMissingOnly?: boolean;
  formId?: string;
}

export function EditModalContent({
  gearType,
  gearSlug,
  gearName,
  gearData,
  onDirtyChange,
  onRequestClose,
  initialShowMissingOnly,
  formId = "edit-gear-form",
}: EditModalContentProps) {
  const [showMissingOnly, setShowMissingOnly] = useState(
    Boolean(initialShowMissingOnly),
  );
  const [isDirty, setIsDirty] = useState(false);

  const preparedData = useMemo(() => {
    const base = gearData as any;
    return {
      ...base,
      ...(typeof base.mountIds === "undefined" && {
        mountIds: base.mountId ? [base.mountId] : [],
      }),
    } as GearItem;
  }, [gearData]);

  // Helper to check if a field is filled
  const isFilled = (v: unknown): boolean => {
    if (v == null) return false;
    if (typeof v === "string") return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  };

  // Build sidebar sections from centralized spec dictionary
  const sidebarSections = useMemo(
    () => buildEditSidebarSections(preparedData),
    [preparedData],
  );
  // Hide Notes from the sidebar entirely
  const sidebarSectionsFiltered = useMemo(
    () => sidebarSections.filter((s) => s.id !== "notes"),
    [sidebarSections],
  );

  // Track expanded state; collapse sections where all items are filled
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    sidebarSectionsFiltered.forEach((section) => {
      const hasFields =
        Array.isArray(section.fields) && section.fields.length > 0;
      const allFilled =
        hasFields && section.fields.every((f) => isFilled(f.rawValue));
      initial[section.id] = hasFields ? !allFilled : true; // collapse if all filled
    });
    return initial;
  });
  const toggle = (k: string) => setExpanded((s) => ({ ...s, [k]: !s[k] }));

  // Scroll handling inside the form container (so anchors work in modal)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const fieldKeyToElementId = useMemo((): Record<string, string> => {
    const core: Record<string, string> = {
      msrpNowUsdCents: "msrpNow",
      msrpAtLaunchUsdCents: "msrpAtLaunch",
      mpbMaxPriceUsdCents: "mpbMaxPrice",
      widthMm: "widthMm",
      heightMm: "heightMm",
      depthMm: "depthMm",
      linkManufacturer: "linkManufacturer",
      linkMpb: "linkMpb",
      linkAmazon: "linkAmazon",
    };
    if (gearType === "CAMERA") {
      return {
        ...core,
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
      };
    }
    // LENS
    return {
      ...core,
      focalLength: "focalLength",
      maxApertureWide: "aperture",
      maxApertureTele: "aperture",
      minApertureWide: "aperture",
      minApertureTele: "aperture",
      hasStabilization: "hasStabilization",
      cipaStabilizationRatingStops: "cipaStabilizationRatingStops",
      hasStabilizationSwitch: "hasStabilizationSwitch",
      hasAutofocus: "hasAutofocus",
      isMacro: "isMacro",
      magnification: "magnification",
      minimumFocusDistanceMm: "minimumFocusDistanceMm",
      hasFocusRing: "hasFocusRing",
      focusMotorType: "focusMotorType",
      hasAfMfSwitch: "hasAfMfSwitch",
      hasFocusLimiter: "hasFocusLimiter",
      hasFocusRecallButton: "hasFocusRecallButton",
      numberElements: "numberElements",
      numberElementGroups: "numberElementGroups",
      hasDiffractiveOptics: "hasDiffractiveOptics",
      numberDiaphragmBlades: "numberDiaphragmBlades",
      hasRoundedDiaphragmBlades: "hasRoundedDiaphragmBlades",
      hasInternalZoom: "hasInternalZoom",
      hasInternalFocus: "hasInternalFocus",
      frontElementRotates: "frontElementRotates",
      mountMaterial: "mountMaterial",
      hasWeatherSealing: "hasWeatherSealing",
      numberCustomControlRings: "numberCustomControlRings",
      numberFunctionButtons: "numberFunctionButtons",
      acceptsFilterTypes: "acceptsFilterTypes",
      frontFilterThreadSizeMm: "frontFilterThreadSizeMm",
      rearFilterThreadSizeMm: "rearFilterThreadSizeMm",
      dropInFilterSizeMm: "dropInFilterSizeMm",
      hasBuiltInTeleconverter: "hasBuiltInTeleconverter",
      hasLensHood: "hasLensHood",
      hasTripodCollar: "hasTripodCollar",
    };
  }, [gearType]);

  const scrollToFieldOrSection = (sectionAnchor: string, fieldKey: string) => {
    const container = scrollContainerRef.current;
    const sectionId = sectionAnchor; // already a bare id like "core-section"
    const candidateId = fieldKeyToElementId[fieldKey] ?? fieldKey;
    const el = (document.getElementById(candidateId) ||
      document.getElementById(sectionId)) as HTMLElement | null;
    if (!el) return;
    const focusEl: HTMLElement | null =
      (el.matches(
        "input,select,textarea,button,[tabindex]:not([tabindex='-1'])",
      )
        ? el
        : (el.querySelector(
            "input,select,textarea,button,[role='switch'],[role='slider'],[contenteditable='true'],[tabindex]:not([tabindex='-1'])",
          ) as HTMLElement | null)) || el;
    const doFocus = () => {
      try {
        if (focusEl && typeof focusEl.focus === "function") {
          focusEl.focus({ preventScroll: true } as any);
        }
      } catch {}
    };
    const headerOffset = 64; // compensate for modal header height and padding
    if (container) {
      const containerTop = container.getBoundingClientRect().top;
      const targetTop = el.getBoundingClientRect().top;
      const offset =
        targetTop - containerTop + container.scrollTop - headerOffset;
      container.scrollTo({ top: offset, behavior: "smooth" });
      requestAnimationFrame(() => doFocus());
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      try {
        window.scrollBy({
          top: -headerOffset,
          left: 0,
          behavior: "instant" as any,
        });
      } catch {
        window.scrollBy({ top: -headerOffset, left: 0 });
      }
      requestAnimationFrame(() => doFocus());
    }
  };

  return (
    <div className="flex max-h-[90vh] flex-col">
      <DialogHeader className="border-b p-3">
        <div className="flex items-center justify-between gap-4">
          <DialogTitle className="">Edit Gear Item</DialogTitle>
          <div className="flex items-center gap-2">
            {/* dirty indicator */}
            <span
              className={`inline-flex items-center gap-1.5 text-xs ${isDirty ? "opacity-100" : "opacity-0"}`}
              aria-live="polite"
            >
              <span
                className={`h-2 w-2 rounded-full ${/* visual dot */ "bg-amber-500"}`}
              />
              <span className="text-muted-foreground">Unsaved</span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRequestClose()}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      </DialogHeader>

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[260px_1fr]">
        <aside className="border-border/60 hidden min-h-0 border-r md:block">
          <div className="h-full overflow-y-auto p-3 pb-16">
            <div className="mb-2 font-semibold">{gearName || gearSlug}</div>
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
                if (showMissingOnly && fieldsToRender.length === 0) {
                  return null;
                }
                return (
                  <div key={section.id} className="space-y-1">
                    <button
                      type="button"
                      className="hover:bg-accent/40 flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-sm"
                      tabIndex={-1}
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
                              scrollToFieldOrSection(section.anchor, field.key)
                            }
                            className="text-muted-foreground hover:text-foreground flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs"
                            tabIndex={-1}
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
        </aside>
        <div
          ref={scrollContainerRef}
          className="min-h-0 overflow-y-auto p-6 pb-36"
        >
          <EditGearForm
            gearType={gearType}
            gearData={preparedData as any}
            gearSlug={gearSlug}
            onDirtyChange={(dirty) => {
              setIsDirty(dirty);
              onDirtyChange?.(dirty);
            }}
            onRequestClose={onRequestClose}
            showActions={false}
            formId={formId}
            showMissingOnly={showMissingOnly}
          />
        </div>
      </div>
      <div className="bg-background border-t px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="edit-modal-show-missing-only">
              Show missing only
            </Label>
            <Switch
              id="edit-modal-show-missing-only"
              checked={showMissingOnly}
              onCheckedChange={setShowMissingOnly}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onRequestClose()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form={formId}
              variant="default"
              icon={<ArrowRight className="size-4" />}
              iconPosition="right"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditModalContent;
