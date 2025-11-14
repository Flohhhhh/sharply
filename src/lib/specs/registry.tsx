import type { SpecsTableSection } from "~/app/(app)/(pages)/gear/_components/specs-table";
import type { GearItem } from "~/types/gear";
import { capitalize, formatHumanDateWithPrecision } from "~/lib/utils";
import {
  formatPrice,
  formatDimensions,
  formatCardSlotDetails,
  formatCameraType,
} from "~/lib/mapping";
import {
  getMountLongNameById,
  getMountLongNamesById,
} from "~/lib/mapping/mounts-map";
import { sensorNameFromId, sensorTypeLabel } from "~/lib/mapping/sensor-map";
import { formatFocusDistance } from "~/lib/mapping/focus-distance-map";
import { formatFilterType } from "~/lib/mapping/filter-types-map";
import { MOUNTS, AF_AREA_MODES } from "~/lib/generated";

function yesNoNull(value: boolean | null | undefined): string | undefined {
  if (value == null) return undefined;
  return value ? "Yes" : "No";
}

function formatDecimalCompact(
  value: number | string | null | undefined,
): string | undefined {
  if (value == null) return undefined;
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return undefined;
  return String(n);
}

// Centralized visibility check for registry values
function hasDisplayValue(value: unknown): boolean {
  if (value == null) return false; // null/undefined
  if (typeof value === "string") return value.trim().length > 0; // empty strings
  if (Array.isArray(value)) return value.length > 0; // empty arrays
  return true; // keep 0, false->mapped to Yes/No earlier, and React nodes
}

// ============================================================================
// TYPES
// ============================================================================

export type SpecFieldDef = {
  key: string; // Stable identifier (e.g., "announcedDate", "resolutionMp")
  label: string; // Human-readable label for display
  getRawValue: (item: GearItem) => unknown; // Extract raw value from GearItem
  formatDisplay?: (raw: unknown, item: GearItem) => React.ReactNode; // Format for display (table, etc.)
  editElementId?: string; // DOM id to focus in the edit UI when navigating from sidebar
  condition?: (item: GearItem) => boolean; // Optional: when to show this field
};

export type SpecSectionDef = {
  id: string; // Section identifier (e.g., "core", "camera-sensor", etc.)
  title: string; // Display title
  sectionAnchor: string; // ID for scrolling (e.g., "core-section")
  condition?: (item: GearItem) => boolean; // Optional: when to show this section
  fields: SpecFieldDef[];
};

// ============================================================================
// CENTRALIZED SPEC DICTIONARY
// ============================================================================

export const specDictionary: SpecSectionDef[] = [
  // ==========================================================================
  // CORE / BASIC INFORMATION
  // ==========================================================================
  {
    id: "core",
    title: "Basic Information",
    sectionAnchor: "core-section",
    fields: [
      {
        key: "cameraType",
        label: "Camera Type",
        getRawValue: (item) =>
          item.gearType === "CAMERA" ? item.cameraSpecs?.cameraType : undefined,
        formatDisplay: (raw) =>
          typeof raw === "string" ? formatCameraType(raw) : undefined,
        condition: (item) => item.gearType === "CAMERA",
      },
      {
        key: "mounts",
        label: "Mount", // Will be overridden based on gear type
        getRawValue: (item) => {
          const ids =
            (Array.isArray(item.mountIds) && item.mountIds.length > 0
              ? item.mountIds
              : []) || (item.mountId ? [item.mountId] : []);
          return ids;
        },
        formatDisplay: (raw, item) => {
          const ids = Array.isArray(raw) ? (raw as string[]) : [];
          if (!ids.length) return undefined;
          // Lenses show all mounts, cameras show first mount only
          return item.gearType === "LENS"
            ? getMountLongNamesById(ids)
            : getMountLongNameById(ids[0]);
        },
        editElementId: "mount",
      },
      {
        key: "announcedDate",
        label: "Announced Date",
        getRawValue: (item) => item.announcedDate,
        formatDisplay: (_, item) =>
          item.announcedDate
            ? formatHumanDateWithPrecision(
                item.announcedDate,
                item.announceDatePrecision ?? "DAY",
              )
            : undefined,
        editElementId: "announced-date",
      },
      {
        key: "releaseDate",
        label: "Release Date",
        getRawValue: (item) => item.releaseDate,
        formatDisplay: (_, item) =>
          item.releaseDate
            ? formatHumanDateWithPrecision(
                item.releaseDate,
                item.releaseDatePrecision ?? "DAY",
              )
            : undefined,
        editElementId: "release-date",
      },
      {
        key: "msrpNowUsdCents",
        label: "MSRP Now",
        getRawValue: (item) => item.msrpNowUsdCents,
        formatDisplay: (raw) => (raw ? formatPrice(raw as number) : undefined),
        editElementId: "msrpNow",
      },
      {
        key: "msrpAtLaunchUsdCents",
        label: "MSRP At Launch",
        getRawValue: (item) => item.msrpAtLaunchUsdCents,
        formatDisplay: (raw) => (raw ? formatPrice(raw as number) : undefined),
        editElementId: "msrpAtLaunch",
      },
      {
        key: "mpbMaxPriceUsdCents",
        label: "MPB Max Price",
        getRawValue: (item) => item.mpbMaxPriceUsdCents,
        formatDisplay: (raw) => (raw ? formatPrice(raw as number) : undefined),
        editElementId: "mpbMaxPrice",
      },
      {
        key: "weightGrams",
        label: "Weight",
        getRawValue: (item) => item.weightGrams,
        formatDisplay: (raw) => {
          const n = raw == null ? NaN : Number(raw);
          return Number.isFinite(n) ? `${n} g` : undefined;
        },
        editElementId: "weight",
      },
      {
        key: "dimensions",
        label: "Dimensions",
        getRawValue: (item) => ({
          widthMm: item.widthMm,
          heightMm: item.heightMm,
          depthMm: item.depthMm,
        }),
        formatDisplay: (_, item) => {
          if (
            item.widthMm == null &&
            item.heightMm == null &&
            item.depthMm == null
          )
            return undefined;
          const dims = formatDimensions({
            widthMm:
              typeof item.widthMm === "number"
                ? item.widthMm
                : item.widthMm != null
                  ? Number(item.widthMm)
                  : null,
            heightMm:
              typeof item.heightMm === "number"
                ? item.heightMm
                : item.heightMm != null
                  ? Number(item.heightMm)
                  : null,
            depthMm:
              typeof item.depthMm === "number"
                ? item.depthMm
                : item.depthMm != null
                  ? Number(item.depthMm)
                  : null,
          });
          return dims || undefined;
        },
        editElementId: "widthMm",
      },
    ],
  },

  // ==========================================================================
  // CAMERA: SENSOR & SHUTTER
  // ==========================================================================
  {
    id: "camera-sensor-shutter",
    title: "Sensor & Shutter",
    sectionAnchor: "camera-section",
    condition: (item) => item.gearType === "CAMERA",
    fields: [
      {
        key: "resolutionMp",
        label: "Resolution",
        getRawValue: (item) => item.cameraSpecs?.resolutionMp,
        formatDisplay: (raw) =>
          raw != null ? `${Number(raw).toFixed(1)} megapixels` : undefined,
      },
      {
        key: "sensorFormatId",
        label: "Sensor Format",
        getRawValue: (item) => item.cameraSpecs?.sensorFormatId,
        formatDisplay: (raw) =>
          raw ? sensorNameFromId(raw as string) : undefined,
        editElementId: "sensorFormatId",
      },
      {
        key: "isoRange",
        label: "ISO Range",
        getRawValue: (item) => ({
          min: item.cameraSpecs?.isoMin,
          max: item.cameraSpecs?.isoMax,
        }),
        formatDisplay: (_, item) =>
          item.cameraSpecs?.isoMin != null && item.cameraSpecs?.isoMax != null
            ? `ISO ${item.cameraSpecs.isoMin} - ${item.cameraSpecs.isoMax}`
            : undefined,
        editElementId: "isoRange",
      },
      {
        key: "maxFpsRaw",
        label: "Max FPS (RAW)",
        getRawValue: (item) => item.cameraSpecs?.maxFpsRaw,
        formatDisplay: (raw) =>
          raw != null ? `${formatDecimalCompact(raw as any)} fps` : undefined,
      },
      {
        key: "maxFpsJpg",
        label: "Max FPS (JPEG)",
        getRawValue: (item) => item.cameraSpecs?.maxFpsJpg,
        formatDisplay: (raw) =>
          raw != null ? `${formatDecimalCompact(raw as any)} fps` : undefined,
      },
      {
        key: "sensorType",
        label: "Sensor Type",
        getRawValue: (item) => item.cameraSpecs,
        formatDisplay: (raw) => {
          if (!raw) return undefined;
          const label = sensorTypeLabel(raw as any);
          return label && label.trim().length > 0 ? label : undefined;
        },
        editElementId: "sensorStackingType",
      },
      {
        key: "sensorReadoutSpeedMs",
        label: "Sensor Readout Speed",
        getRawValue: (item) => item.cameraSpecs?.sensorReadoutSpeedMs,
        formatDisplay: (raw) =>
          typeof raw === "number" || typeof raw === "string"
            ? String(raw)
            : undefined,
      },
      {
        key: "hasIbis",
        label: "Has IBIS",
        getRawValue: (item) => item.cameraSpecs?.hasIbis,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
      },
      {
        key: "hasElectronicVibrationReduction",
        label: "Has Electronic VR",
        getRawValue: (item) =>
          item.cameraSpecs?.hasElectronicVibrationReduction,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
      },
      {
        key: "cipaStabilizationRatingStops",
        label: "CIPA Stabilization Rating Stops",
        getRawValue: (item) => item.cameraSpecs?.cipaStabilizationRatingStops,
        formatDisplay: (raw) =>
          typeof raw === "number" || typeof raw === "string"
            ? String(raw)
            : undefined,
      },
      {
        key: "hasPixelShiftShooting",
        label: "Has Pixel Shift Shooting",
        getRawValue: (item) => item.cameraSpecs?.hasPixelShiftShooting,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
      },
      {
        key: "hasAntiAliasingFilter",
        label: "Has Anti Aliasing Filter",
        getRawValue: (item) => item.cameraSpecs?.hasAntiAliasingFilter,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
      },
      {
        key: "shutterSpeedMax",
        label: "Longest Shutter Speed",
        getRawValue: (item) => item.cameraSpecs?.shutterSpeedMax,
        formatDisplay: (raw) => {
          const n = raw == null ? NaN : Number(raw);
          return Number.isFinite(n) ? `${n} seconds` : undefined;
        },
      },
      {
        key: "shutterSpeedMin",
        label: "Fastest Shutter Speed",
        getRawValue: (item) => item.cameraSpecs?.shutterSpeedMin,
        formatDisplay: (raw) => {
          const n = raw == null ? NaN : Number(raw);
          return Number.isFinite(n) ? `1/${n}s` : undefined;
        },
      },
      {
        key: "flashSyncSpeed",
        label: "Flash Sync Speed",
        getRawValue: (item) => item.cameraSpecs?.flashSyncSpeed,
        formatDisplay: (raw) => {
          const n = raw == null ? NaN : Number(raw);
          return Number.isFinite(n) ? `1/${n}s` : undefined;
        },
      },
      {
        key: "hasSilentShootingAvailable",
        label: "Has Silent Shooting Available",
        getRawValue: (item) => item.cameraSpecs?.hasSilentShootingAvailable,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
      },
      {
        key: "availableShutterTypes",
        label: "Available Shutter Types",
        getRawValue: (item) => item.cameraSpecs?.availableShutterTypes,
        formatDisplay: (raw) => {
          if (!Array.isArray(raw)) return undefined;
          const entries = raw.filter(
            (value): value is string =>
              typeof value === "string" && value.length > 0,
          );
          if (entries.length === 0) return undefined;
          return (
            <ul className="list-disc list-inside space-y-1">
              {entries.map((type) => (
                <li key={type}>{capitalize(type)}</li>
              ))}
            </ul>
          );
        },
        editElementId: "availableShutterTypes",
      },
    ],
  },

  // ==========================================================================
  // CAMERA: HARDWARE/BUILD
  // ==========================================================================
  {
    id: "camera-hardware",
    title: "Hardware/Build",
    sectionAnchor: "camera-section",
    condition: (item) => item.gearType === "CAMERA",
    fields: [
      {
        key: "cardSlots",
        label: "Card Slots",
        getRawValue: (item) => item.cameraCardSlots,
        formatDisplay: (_, item) =>
          item.cameraCardSlots && item.cameraCardSlots.length > 0 ? (
            <div className="flex flex-col gap-1">
              {item.cameraCardSlots
                .sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0))
                .map((s, i) => {
                  const details = formatCardSlotDetails({
                    slotIndex: s.slotIndex,
                    supportedFormFactors: s.supportedFormFactors ?? [],
                    supportedBuses: s.supportedBuses ?? [],
                    supportedSpeedClasses: s.supportedSpeedClasses ?? [],
                  });
                  return (
                    <div key={i} className="flex justify-between gap-6">
                      <span className="text-muted-foreground">
                        Slot {s.slotIndex}
                      </span>
                      <span className="font-medium">{details}</span>
                    </div>
                  );
                })}
            </div>
          ) : undefined,
      },
      {
        key: "processorName",
        label: "Processor Name",
        getRawValue: (item) => item.cameraSpecs?.processorName,
        formatDisplay: (raw) =>
          typeof raw === "string" && raw.trim().length > 0 ? raw : undefined,
      },
      {
        key: "hasWeatherSealing",
        label: "Weather Sealing",
        getRawValue: (item) => item.cameraSpecs?.hasWeatherSealing,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
      },
      {
        key: "rearDisplayType",
        label: "Rear Display Type",
        getRawValue: (item) => item.cameraSpecs?.rearDisplayType,
        formatDisplay: (raw) => {
          if (typeof raw !== "string") return undefined;
          const map: Record<string, string> = {
            none: "None",
            fixed: "Fixed",
            single_axis_tilt: "Single-axis tilt",
            dual_axis_tilt: "Dual-axis tilt",
            fully_articulated: "Fully articulated",
          };
          return map[raw] ?? raw;
        },
      },
      {
        key: "rearDisplaySizeInches",
        label: "Rear Display Size",
        getRawValue: (item) => item.cameraSpecs?.rearDisplaySizeInches,
        formatDisplay: (raw) => {
          const n = raw == null ? NaN : Number(raw);
          return Number.isFinite(n) ? `${n.toFixed(2)} inches` : undefined;
        },
      },
      {
        key: "rearDisplayResolutionMillionDots",
        label: "Rear Display Resolution",
        getRawValue: (item) =>
          item.cameraSpecs?.rearDisplayResolutionMillionDots,
        formatDisplay: (raw) => {
          const n = raw == null ? NaN : Number(raw);
          return Number.isFinite(n)
            ? `${n.toFixed(2)} million dots`
            : undefined;
        },
      },
      {
        key: "viewfinderType",
        label: "Viewfinder Type",
        getRawValue: (item) => item.cameraSpecs?.viewfinderType,
        formatDisplay: (raw) => {
          if (typeof raw !== "string") return undefined;
          const map: Record<string, string> = {
            none: "None",
            optical: "OVF",
            electronic: "EVF",
          };
          return map[raw] ?? raw;
        },
      },
      {
        key: "viewfinderMagnification",
        label: "Viewfinder Magnification",
        getRawValue: (item) => item.cameraSpecs?.viewfinderMagnification,
        formatDisplay: (raw, item) => {
          const vfType = item.cameraSpecs?.viewfinderType;
          if (!vfType || vfType === "none") return undefined;
          const n = raw == null ? NaN : Number(raw);
          return Number.isFinite(n) ? `${n.toFixed(2)}x` : undefined;
        },
      },
      {
        key: "viewfinderResolutionMillionDots",
        label: "Viewfinder Resolution",
        getRawValue: (item) =>
          item.cameraSpecs?.viewfinderResolutionMillionDots,
        formatDisplay: (raw, item) => {
          const vfType = item.cameraSpecs?.viewfinderType;
          if (vfType !== "electronic") return undefined;
          const n = raw == null ? NaN : Number(raw);
          return Number.isFinite(n)
            ? `${n.toFixed(2)} million dots`
            : undefined;
        },
      },
      {
        key: "hasTopDisplay",
        label: "Has Top Display",
        getRawValue: (item) => item.cameraSpecs?.hasTopDisplay,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
      },
      {
        key: "hasRearTouchscreen",
        label: "Has Rear Touchscreen",
        getRawValue: (item) => item.cameraSpecs?.hasRearTouchscreen,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
      },
    ],
  },

  // ==========================================================================
  // CAMERA: FOCUS
  // ==========================================================================
  {
    id: "camera-focus",
    title: "Focus",
    sectionAnchor: "camera-section",
    condition: (item) => item.gearType === "CAMERA",
    fields: [
      {
        key: "focusPoints",
        label: "Focus Points",
        getRawValue: (item) => item.cameraSpecs?.focusPoints,
        formatDisplay: (raw) =>
          typeof raw === "number" || typeof raw === "string"
            ? String(raw)
            : undefined,
      },
      {
        key: "afAreaModes",
        label: "AF Area Modes",
        getRawValue: (item) => item.cameraSpecs?.afAreaModes,
        formatDisplay: (raw) => {
          if (!Array.isArray(raw) || raw.length === 0) return undefined;
          const toName = (
            v:
              | string
              | { id?: string | null; name?: string | null }
              | null
              | undefined,
          ): string | undefined => {
            if (typeof v === "string") {
              const found = AF_AREA_MODES.find((m) => m.id === v);
              return typeof found?.name === "string" ? found.name : v;
            }
            if (v && typeof v === "object") {
              if (typeof v.name === "string" && v.name.trim().length > 0)
                return v.name;
              if (typeof v.id === "string") {
                const found = AF_AREA_MODES.find((m) => m.id === v.id);
                return typeof found?.name === "string" ? found.name : v.id;
              }
            }
            return undefined;
          };
          const names = (
            raw as Array<string | { id?: string | null; name?: string | null }>
          )
            .map(toName)
            .filter((s): s is string => typeof s === "string" && s.length > 0);
          return names.length > 0 ? names.join(", ") : undefined;
        },
        editElementId: "afAreaModes",
      },
      {
        key: "afSubjectCategories",
        label: "AF Subject Categories",
        getRawValue: (item) => item.cameraSpecs?.afSubjectCategories,
        formatDisplay: (raw) =>
          Array.isArray(raw) ? raw.join(", ") : undefined,
        editElementId: "afSubjectCategories",
      },
      {
        key: "hasFocusPeaking",
        label: "Has Focus Peaking",
        getRawValue: (item) => item.cameraSpecs?.hasFocusPeaking,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
      },
      {
        key: "hasFocusBracketing",
        label: "Has Focus Bracketing",
        getRawValue: (item) => item.cameraSpecs?.hasFocusBracketing,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
      },
    ],
  },

  // ==========================================================================
  // CAMERA: BATTERY & CHARGING
  // ==========================================================================
  {
    id: "camera-battery",
    title: "Battery & Charging",
    sectionAnchor: "camera-section",
    condition: (item) => item.gearType === "CAMERA",
    fields: [
      {
        key: "cipaBatteryShotsPerCharge",
        label: "CIPA Battery Shots Per Charge",
        getRawValue: (item) => item.cameraSpecs?.cipaBatteryShotsPerCharge,
        formatDisplay: (raw) =>
          typeof raw === "number" || typeof raw === "string"
            ? String(raw)
            : undefined,
      },
      {
        key: "supportedBatteries",
        label: "Supported Batteries",
        getRawValue: (item) => item.cameraSpecs?.supportedBatteries,
        formatDisplay: (raw) =>
          Array.isArray(raw) ? raw.join(", ") : undefined,
        editElementId: "supportedBatteries",
      },
      {
        key: "usbCharging",
        label: "Supports USB Charging",
        getRawValue: (item) => item.cameraSpecs?.usbCharging,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
      },
      {
        key: "usbPowerDelivery",
        label: "USB Power Delivery",
        getRawValue: (item) => item.cameraSpecs?.usbPowerDelivery,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
      },
    ],
  },

  // ==========================================================================
  // CAMERA: VIDEO
  // ==========================================================================
  {
    id: "camera-video",
    title: "Video",
    sectionAnchor: "camera-section",
    condition: (item) => item.gearType === "CAMERA",
    fields: [
      {
        key: "hasLogColorProfile",
        label: "Has Log Color Profile",
        getRawValue: (item) => item.cameraSpecs?.hasLogColorProfile,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
      },
      {
        key: "has10BitVideo",
        label: "Has 10 Bit Video",
        getRawValue: (item) => item.cameraSpecs?.has10BitVideo,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
      },
      {
        key: "has12BitVideo",
        label: "Has 12 Bit Video",
        getRawValue: (item) => item.cameraSpecs?.has12BitVideo,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
      },
    ],
  },

  // ==========================================================================
  // CAMERA: MISC
  // ==========================================================================
  {
    id: "camera-misc",
    title: "Misc",
    sectionAnchor: "camera-section",
    condition: (item) => item.gearType === "CAMERA",
    fields: [
      {
        key: "hasIntervalometer",
        label: "Has Intervalometer",
        getRawValue: (item) => item.cameraSpecs?.hasIntervalometer,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
      },
      {
        key: "hasSelfTimer",
        label: "Has Self Timer",
        getRawValue: (item) => item.cameraSpecs?.hasSelfTimer,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
      },
      {
        key: "hasBuiltInFlash",
        label: "Has Built In Flash",
        getRawValue: (item) => item.cameraSpecs?.hasBuiltInFlash,
        formatDisplay: (raw) => yesNoNull(raw as any),
      },
      {
        key: "hasHotShoe",
        label: "Has Hot Shoe",
        getRawValue: (item) => item.cameraSpecs?.hasHotShoe,
        formatDisplay: (raw) => yesNoNull(raw as any),
      },
    ],
  },

  // ==========================================================================
  // LENS: OPTICS
  // ==========================================================================
  {
    id: "lens-optics",
    title: "Optics",
    sectionAnchor: "lens-section",
    condition: (item) => item.gearType === "LENS",
    fields: [
      {
        key: "isPrime",
        label: "Lens Type",
        getRawValue: (item) => item.lensSpecs?.isPrime,
        formatDisplay: (raw) => (raw ? "Prime" : "Zoom"),
      },
      {
        key: "focalLength",
        label: "Focal Length",
        getRawValue: (item) => ({
          isPrime: item.lensSpecs?.isPrime,
          min: item.lensSpecs?.focalLengthMinMm,
          max: item.lensSpecs?.focalLengthMaxMm,
        }),
        formatDisplay: (_, item) =>
          item.lensSpecs?.isPrime
            ? `${item.lensSpecs?.focalLengthMinMm}mm`
            : `${item.lensSpecs?.focalLengthMinMm}mm - ${item.lensSpecs?.focalLengthMaxMm}mm`,
      },
      {
        key: "isMacro",
        label: "Is Macro",
        getRawValue: (item) => item.lensSpecs?.isMacro,
        formatDisplay: (raw) =>
          raw != null ? (raw ? "Yes" : "No") : undefined,
      },
      {
        key: "magnification",
        label: "Magnification",
        getRawValue: (item) => item.lensSpecs?.magnification,
        formatDisplay: (raw) => {
          const n = raw == null ? NaN : Number(raw);
          return Number.isFinite(n) ? `${n}x` : undefined;
        },
      },
      {
        key: "minimumFocusDistanceMm",
        label: "Minimum Focus Distance",
        getRawValue: (item) => item.lensSpecs?.minimumFocusDistanceMm,
        formatDisplay: (raw) =>
          raw != null ? formatFocusDistance(raw as number) : undefined,
      },
      {
        key: "numberElements",
        label: "Number of Elements",
        getRawValue: (item) => item.lensSpecs?.numberElements,
      },
      {
        key: "numberElementGroups",
        label: "Number of Element Groups",
        getRawValue: (item) => item.lensSpecs?.numberElementGroups,
      },
      {
        key: "hasDiffractiveOptics",
        label: "Has Diffractive Optics",
        getRawValue: (item) => item.lensSpecs?.hasDiffractiveOptics,
        formatDisplay: (raw) =>
          raw != null ? (raw ? "Yes" : "No") : undefined,
      },
    ],
  },

  // ==========================================================================
  // LENS: APERTURE
  // ==========================================================================
  {
    id: "lens-aperture",
    title: "Aperture",
    sectionAnchor: "lens-section",
    condition: (item) => item.gearType === "LENS",
    fields: [
      {
        key: "maxAperture",
        label: "Maximum Aperture",
        getRawValue: (item) => ({
          wide: item.lensSpecs?.maxApertureWide,
          tele: item.lensSpecs?.maxApertureTele,
        }),
        formatDisplay: (_, item) =>
          item.lensSpecs?.maxApertureTele &&
          item.lensSpecs?.maxApertureTele !== item.lensSpecs?.maxApertureWide
            ? `f/${Number(item.lensSpecs?.maxApertureWide)} - f/${Number(item.lensSpecs?.maxApertureTele)}`
            : item.lensSpecs?.maxApertureWide != null
              ? `f/${Number(item.lensSpecs?.maxApertureWide)}`
              : undefined,
        editElementId: "aperture-max-wide",
      },
      {
        key: "minAperture",
        label: "Minimum Aperture",
        getRawValue: (item) => ({
          wide: item.lensSpecs?.minApertureWide,
          tele: item.lensSpecs?.minApertureTele,
        }),
        formatDisplay: (_, item) =>
          item.lensSpecs?.minApertureTele &&
          item.lensSpecs?.minApertureTele !== item.lensSpecs?.minApertureWide
            ? `f/${Number(item.lensSpecs?.minApertureWide)} - f/${Number(item.lensSpecs?.minApertureTele)}`
            : item.lensSpecs?.minApertureWide != null
              ? `f/${Number(item.lensSpecs?.minApertureWide)}`
              : undefined,
        editElementId: "aperture-min-wide",
      },
      {
        key: "numberDiaphragmBlades",
        label: "Number of Diaphragm Blades",
        getRawValue: (item) => item.lensSpecs?.numberDiaphragmBlades,
      },
      {
        key: "hasRoundedDiaphragmBlades",
        label: "Has Rounded Diaphragm Blades",
        getRawValue: (item) => item.lensSpecs?.hasRoundedDiaphragmBlades,
        formatDisplay: (raw) =>
          raw != null ? (raw ? "Yes" : "No") : undefined,
      },
      {
        key: "hasApertureRing",
        label: "Has Aperture Ring",
        getRawValue: (item) => item.lensSpecs?.hasApertureRing,
        formatDisplay: (raw) =>
          raw != null ? (raw ? "Yes" : "No") : undefined,
      },
    ],
  },

  // ==========================================================================
  // LENS: FOCUS
  // ==========================================================================
  {
    id: "lens-focus",
    title: "Focus",
    sectionAnchor: "lens-section",
    condition: (item) => item.gearType === "LENS",
    fields: [
      {
        key: "hasAutofocus",
        label: "Has Autofocus",
        getRawValue: (item) => item.lensSpecs?.hasAutofocus,
        formatDisplay: (raw) =>
          raw != null ? (raw ? "Yes" : "No") : undefined,
      },
      {
        key: "focusMotorType",
        label: "Focus Motor Type",
        getRawValue: (item) => item.lensSpecs?.focusMotorType,
        formatDisplay: (raw) => (raw as string) ?? undefined,
      },
      {
        key: "hasAfMfSwitch",
        label: "Has AF/MF Switch",
        getRawValue: (item) => item.lensSpecs?.hasAfMfSwitch,
        formatDisplay: (raw) =>
          raw != null ? (raw ? "Yes" : "No") : undefined,
      },
      {
        key: "hasFocusLimiter",
        label: "Has Focus Limiter",
        getRawValue: (item) => item.lensSpecs?.hasFocusLimiter,
        formatDisplay: (raw) =>
          raw != null ? (raw ? "Yes" : "No") : undefined,
      },
      {
        key: "hasFocusRecallButton",
        label: "Has Focus Recall Button",
        getRawValue: (item) => item.lensSpecs?.hasFocusRecallButton,
        formatDisplay: (raw) =>
          raw != null ? (raw ? "Yes" : "No") : undefined,
      },
      {
        key: "hasFocusRing",
        label: "Has Focus Ring",
        getRawValue: (item) => item.lensSpecs?.hasFocusRing,
        formatDisplay: (raw) =>
          raw != null ? (raw ? "Yes" : "No") : undefined,
      },
      {
        key: "hasInternalFocus",
        label: "Has Internal Focus",
        getRawValue: (item) => item.lensSpecs?.hasInternalFocus,
        formatDisplay: (raw) =>
          raw != null ? (raw ? "Yes" : "No") : undefined,
      },
      {
        key: "frontElementRotates",
        label: "Front Element Rotates",
        getRawValue: (item) => item.lensSpecs?.frontElementRotates,
        formatDisplay: (raw) =>
          raw != null ? (raw ? "Yes" : "No") : undefined,
      },
    ],
  },

  // ==========================================================================
  // LENS: STABILIZATION
  // ==========================================================================
  {
    id: "lens-stabilization",
    title: "Stabilization",
    sectionAnchor: "lens-section",
    condition: (item) => item.gearType === "LENS",
    fields: [
      {
        key: "hasStabilization",
        label: "Has Image Stabilization",
        getRawValue: (item) => item.lensSpecs?.hasStabilization,
        formatDisplay: (raw) =>
          raw != null ? (raw ? "Yes" : "No") : undefined,
      },
      {
        key: "hasStabilizationSwitch",
        label: "Has Stabilization Switch",
        getRawValue: (item) => item.lensSpecs?.hasStabilizationSwitch,
        formatDisplay: (raw) =>
          raw != null ? (raw ? "Yes" : "No") : undefined,
        condition: (item) => item.lensSpecs?.hasStabilization === true,
      },
      {
        key: "cipaStabilizationRatingStops",
        label: "CIPA Stabilization Rating Stops",
        getRawValue: (item) => item.lensSpecs?.cipaStabilizationRatingStops,
        formatDisplay: (raw) => {
          const n = raw == null ? NaN : Number(raw);
          return Number.isFinite(n) ? `${n} stops` : undefined;
        },
        condition: (item) => item.lensSpecs?.hasStabilization === true,
      },
    ],
  },

  // ==========================================================================
  // LENS: BUILD & CONTROLS
  // ==========================================================================
  {
    id: "lens-build",
    title: "Build & Controls",
    sectionAnchor: "lens-section",
    condition: (item) => item.gearType === "LENS",
    fields: [
      {
        key: "hasInternalZoom",
        label: "Has Internal Zoom",
        getRawValue: (item) => item.lensSpecs?.hasInternalZoom,
        formatDisplay: (raw) =>
          raw != null ? (raw ? "Yes" : "No") : undefined,
      },
      {
        key: "mountMaterial",
        label: "Mount Material",
        getRawValue: (item) => item.lensSpecs?.mountMaterial,
        formatDisplay: (raw) =>
          raw != null
            ? (raw as string).charAt(0).toUpperCase() + (raw as string).slice(1)
            : undefined,
      },
      {
        key: "hasWeatherSealing",
        label: "Has Weather Sealing",
        getRawValue: (item) => item.lensSpecs?.hasWeatherSealing,
        formatDisplay: (raw) =>
          raw != null ? (raw ? "Yes" : "No") : undefined,
      },
      {
        key: "numberCustomControlRings",
        label: "Number of Custom Control Rings",
        getRawValue: (item) => item.lensSpecs?.numberCustomControlRings,
      },
      {
        key: "numberFunctionButtons",
        label: "Number of Function Buttons",
        getRawValue: (item) => item.lensSpecs?.numberFunctionButtons,
      },
    ],
  },

  // ==========================================================================
  // LENS: FILTERS
  // ==========================================================================
  {
    id: "lens-filters",
    title: "Filters",
    sectionAnchor: "lens-section",
    condition: (item) => item.gearType === "LENS",
    fields: [
      {
        key: "acceptsFilterTypes",
        label: "Accepts Filter Types",
        getRawValue: (item) => item.lensSpecs?.acceptsFilterTypes,
        formatDisplay: (raw) =>
          Array.isArray(raw) && raw.length > 0
            ? raw.map(formatFilterType).join(", ")
            : undefined,
        editElementId: "acceptsFilterTypes",
      },
      {
        key: "frontFilterThreadSizeMm",
        label: "Front Filter Thread Size",
        getRawValue: (item) => item.lensSpecs?.frontFilterThreadSizeMm,
        formatDisplay: (raw, item) =>
          raw != null &&
          item.lensSpecs?.acceptsFilterTypes?.includes("front-screw-on")
            ? `${Number(raw)}mm`
            : undefined,
        condition: (item) =>
          Array.isArray(item.lensSpecs?.acceptsFilterTypes) &&
          item.lensSpecs!.acceptsFilterTypes!.includes("front-screw-on"),
      },
      {
        key: "rearFilterThreadSizeMm",
        label: "Rear Filter Thread Size",
        getRawValue: (item) => item.lensSpecs?.rearFilterThreadSizeMm,
        formatDisplay: (raw, item) =>
          raw != null &&
          item.lensSpecs?.acceptsFilterTypes?.includes("rear-screw-on")
            ? `${Number(raw)}mm`
            : undefined,
        condition: (item) =>
          Array.isArray(item.lensSpecs?.acceptsFilterTypes) &&
          item.lensSpecs!.acceptsFilterTypes!.includes("rear-screw-on"),
      },
      {
        key: "dropInFilterSizeMm",
        label: "Drop In Filter Size",
        getRawValue: (item) => item.lensSpecs?.dropInFilterSizeMm,
        formatDisplay: (raw, item) =>
          raw != null &&
          item.lensSpecs?.acceptsFilterTypes?.includes("rear-drop-in")
            ? `${Number(raw)}mm`
            : undefined,
        condition: (item) =>
          Array.isArray(item.lensSpecs?.acceptsFilterTypes) &&
          item.lensSpecs!.acceptsFilterTypes!.includes("rear-drop-in"),
      },
    ],
  },

  // ==========================================================================
  // LENS: ACCESSORIES
  // ==========================================================================
  {
    id: "lens-accessories",
    title: "Accessories",
    sectionAnchor: "lens-section",
    condition: (item) => item.gearType === "LENS",
    fields: [
      {
        key: "hasBuiltInTeleconverter",
        label: "Has Built In Teleconverter",
        getRawValue: (item) => item.lensSpecs?.hasBuiltInTeleconverter,
        formatDisplay: (raw) =>
          raw != null ? (raw ? "Yes" : "No") : undefined,
      },
      {
        key: "hasLensHood",
        label: "Has Lens Hood",
        getRawValue: (item) => item.lensSpecs?.hasLensHood,
        formatDisplay: (raw) =>
          raw != null ? (raw ? "Yes" : "No") : undefined,
      },
      {
        key: "hasTripodCollar",
        label: "Has Tripod Collar/Lens Foot",
        getRawValue: (item) => item.lensSpecs?.hasTripodCollar,
        formatDisplay: (raw) =>
          raw != null ? (raw ? "Yes" : "No") : undefined,
      },
    ],
  },

  // ==========================================================================
  // INTEGRATED LENS (for fixed-lens cameras)
  // ==========================================================================
  {
    id: "fixed-lens",
    title: "Integrated Lens",
    sectionAnchor: "fixed-lens-section",
    condition: (item) => {
      if (item.gearType !== "CAMERA") return false;
      type MountGenerated = (typeof MOUNTS)[number];
      const mountValueById = (id: string | null | undefined): string | null => {
        if (!id) return null;
        const m = MOUNTS.find((x) => x.id === id);
        return m && typeof m.value === "string" ? m.value : null;
      };
      const primaryMountId = (() => {
        const arr = Array.isArray(item.mountIds) ? item.mountIds : [];
        if (arr.length > 0) return arr[0]!;
        return (item.mountId as string | null | undefined) ?? null;
      })();
      return mountValueById(primaryMountId) === "fixed-lens";
    },
    fields: [
      {
        key: "isPrime",
        label: "Lens Type",
        getRawValue: (item) => item.fixedLensSpecs?.isPrime,
        formatDisplay: (raw) =>
          raw == null ? undefined : raw ? "Prime" : "Zoom",
      },
      {
        key: "focalLength",
        label: "Focal Length",
        getRawValue: (item) => ({
          isPrime: item.fixedLensSpecs?.isPrime,
          min: item.fixedLensSpecs?.focalLengthMinMm,
          max: item.fixedLensSpecs?.focalLengthMaxMm,
        }),
        formatDisplay: (_, item) => {
          if (
            item.fixedLensSpecs?.focalLengthMinMm == null &&
            item.fixedLensSpecs?.focalLengthMaxMm == null
          )
            return undefined;
          return item.fixedLensSpecs?.isPrime
            ? `${item.fixedLensSpecs?.focalLengthMinMm}mm`
            : `${item.fixedLensSpecs?.focalLengthMinMm ?? ""}${
                item.fixedLensSpecs?.focalLengthMinMm != null &&
                item.fixedLensSpecs?.focalLengthMaxMm != null
                  ? "mm - "
                  : ""
              }${
                item.fixedLensSpecs?.focalLengthMaxMm != null
                  ? `${item.fixedLensSpecs?.focalLengthMaxMm}mm`
                  : ""
              }`;
        },
      },
      {
        key: "maxAperture",
        label: "Maximum Aperture",
        getRawValue: (item) => ({
          wide: item.fixedLensSpecs?.maxApertureWide,
          tele: item.fixedLensSpecs?.maxApertureTele,
        }),
        formatDisplay: (_, item) =>
          item.fixedLensSpecs?.maxApertureTele &&
          item.fixedLensSpecs?.maxApertureTele !==
            item.fixedLensSpecs?.maxApertureWide
            ? `f/${Number(item.fixedLensSpecs?.maxApertureWide)} - f/${Number(item.fixedLensSpecs?.maxApertureTele)}`
            : item.fixedLensSpecs?.maxApertureWide != null
              ? `f/${Number(item.fixedLensSpecs?.maxApertureWide)}`
              : undefined,
        editElementId: "fixed-lens-aperture-max-wide",
      },
      {
        key: "minAperture",
        label: "Minimum Aperture",
        getRawValue: (item) => ({
          wide: item.fixedLensSpecs?.minApertureWide,
          tele: item.fixedLensSpecs?.minApertureTele,
        }),
        formatDisplay: (_, item) =>
          item.fixedLensSpecs?.minApertureTele &&
          item.fixedLensSpecs?.minApertureTele !==
            item.fixedLensSpecs?.minApertureWide
            ? `f/${Number(item.fixedLensSpecs?.minApertureWide)} - f/${Number(item.fixedLensSpecs?.minApertureTele)}`
            : item.fixedLensSpecs?.minApertureWide != null
              ? `f/${Number(item.fixedLensSpecs?.minApertureWide)}`
              : undefined,
        editElementId: "fixed-lens-aperture-min-wide",
      },
      {
        key: "hasAutofocus",
        label: "Has Autofocus",
        getRawValue: (item) => item.fixedLensSpecs?.hasAutofocus,
        formatDisplay: (raw) => yesNoNull(raw as any),
      },
      {
        key: "minimumFocusDistanceMm",
        label: "Minimum Focus Distance",
        getRawValue: (item) => item.fixedLensSpecs?.minimumFocusDistanceMm,
        formatDisplay: (raw) =>
          raw != null ? formatFocusDistance(raw as number) : undefined,
      },
      {
        key: "frontElementRotates",
        label: "Front Element Rotates",
        getRawValue: (item) => item.fixedLensSpecs?.frontElementRotates,
        formatDisplay: (raw) => yesNoNull(raw as any),
      },
      {
        key: "frontFilterThreadSizeMm",
        label: "Front Filter Thread Size",
        getRawValue: (item) => item.fixedLensSpecs?.frontFilterThreadSizeMm,
        formatDisplay: (raw) => {
          const n = raw == null ? NaN : Number(raw);
          return Number.isFinite(n) ? `${n}mm` : undefined;
        },
      },
      {
        key: "hasLensHood",
        label: "Has Lens Hood",
        getRawValue: (item) => item.fixedLensSpecs?.hasLensHood,
        formatDisplay: (raw) => yesNoNull(raw as any),
      },
    ],
  },

  // ==========================================================================
  // NOTES
  // ==========================================================================
  {
    id: "notes",
    title: "Notes",
    sectionAnchor: "notes-section",
    fields: [
      {
        key: "notes",
        label: "",
        getRawValue: (item) => item.notes,
        formatDisplay: (raw) => {
          if (!Array.isArray(raw)) return undefined;
          const list = raw.filter(
            (n) => typeof n === "string" && n.trim().length > 0,
          );
          return list.length ? (
            <ul className="text-muted-foreground list-disc space-y-1 pl-4 text-sm">
              {list.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          ) : undefined;
        },
      },
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build sections for the specs table display
 */
export function buildGearSpecsSections(item: GearItem): SpecsTableSection[] {
  return specDictionary
    .filter((section) => !section.condition || section.condition(item))
    .map((section) => ({
      title: section.title,
      data: section.fields
        .map((field) => {
          const raw = field.getRawValue(item);
          const value = field.formatDisplay
            ? field.formatDisplay(raw, item)
            : (raw as React.ReactNode);
          return {
            label: field.label,
            value: value,
            fullWidth: !field.label,
          };
        })
        .filter((row) => hasDisplayValue(row.value)),
    }))
    .filter((section) => section.data.length > 0);
}

/**
 * Build sections for the edit sidebar (tree view)
 */
export type SidebarSection = {
  id: string;
  title: string;
  anchor: string;
  fields: {
    key: string;
    label: string;
    rawValue: unknown;
    targetId: string;
  }[];
};

export function buildEditSidebarSections(item: GearItem): SidebarSection[] {
  return specDictionary
    .filter((section) => !section.condition || section.condition(item))
    .map((section) => ({
      id: section.id,
      title: section.title,
      anchor: section.sectionAnchor,
      fields: section.fields
        .filter((f) => (!f.condition || f.condition(item)) && f.label) // Skip fields without labels or failing condition
        .map((field) => ({
          key: field.key,
          label: field.label,
          rawValue: field.getRawValue(item),
          targetId: field.editElementId ?? field.key,
        })),
    }));
}
