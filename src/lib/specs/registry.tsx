import type { SpecsTableSection } from "~/app/(app)/(pages)/gear/_components/specs-table";
import type { GearItem } from "~/types/gear";
import { cn } from "~/lib/utils";
import { formatHumanDateWithPrecision } from "~/lib/utils";
import {
  formatPrice,
  formatDimensions,
  formatLensDimensions,
  formatCardSlotDetails,
  formatCameraType,
  formatShutterType,
  formatPrecaptureSupport,
} from "~/lib/mapping";
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
import {
  getMountLongNameById,
  getMountLongNamesById,
} from "~/lib/mapping/mounts-map";
import { sensorNameFromId, sensorTypeLabel } from "~/lib/mapping/sensor-map";
import { formatMaxFpsDisplay } from "~/lib/mapping/max-fps-map";
import { formatFocusDistance } from "~/lib/mapping/focus-distance-map";
import { formatFilterType } from "~/lib/mapping/filter-types-map";
import { formatFocalLengthRangeDisplay } from "~/lib/mapping/focal-length-map";
import { MOUNTS, AF_AREA_MODES } from "~/lib/generated";
import { buildVideoDisplayBundle } from "~/lib/video/transform";
import { VideoSpecsSummary } from "~/app/(app)/(pages)/gear/_components/video/video-summary";
import { Badge } from "~/components/ui/badge";
import {
  normalizedToCameraVideoModes,
  type VideoModeNormalized,
} from "~/lib/video/mode-schema";
import type { CameraVideoMode } from "~/types/gear";
import { supportsVideoMeaningfully } from "./helpers";
import { Item } from "@radix-ui/react-toggle-group";
import { type GearRegion } from "~/lib/gear/region";

function coerceCameraVideoModes(
  modes?: GearItem["videoModes"],
): CameraVideoMode[] {
  if (!modes?.length) return [];
  const first = modes[0] as CameraVideoMode | VideoModeNormalized | undefined;
  if (first && "id" in first) {
    return modes as CameraVideoMode[];
  }
  return normalizedToCameraVideoModes((modes ?? []) as VideoModeNormalized[]);
}

function yesNoNull(
  value: boolean | null | undefined,
  hideIfFalse?: boolean,
): string | undefined {
  if (value == null || (value === false && hideIfFalse === true))
    return undefined;
  return value ? "Yes" : "No";
}
// Helper function to format a decimal number in a compact format
// If it's a whole number display as integer, otherwise display with up to 1 decimal
function formatDecimalCompact(
  value: number | string | null | undefined,
): string | undefined {
  if (value == null) return undefined;
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return undefined;
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(1)));
}

function formatStorageGb(value: unknown): string | undefined {
  if (value == null) return undefined;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return undefined;
  if (num >= 1000) {
    const tb = num / 1000;
    const formattedTb = Number.isInteger(tb) ? tb.toFixed(0) : tb.toFixed(1);
    return `${formattedTb} TB`;
  }
  const formattedGb = Number.isInteger(num) ? num.toFixed(0) : num.toFixed(1);
  return `${formattedGb} GB`;
}

// Centralized visibility check for registry values
function hasDisplayValue(value: unknown): boolean {
  if (value == null) return false; // null/undefined
  if (typeof value === "string") return value.trim().length > 0; // empty strings
  if (Array.isArray(value)) return value.length > 0; // empty arrays
  return true; // keep 0, false->mapped to Yes/No earlier, and React nodes
}

function renderBadgeColumn(
  values: string[],
  forceLeftAlign?: boolean,
  singleItemPerRow?: boolean,
): React.ReactNode | undefined {
  const cleaned = values
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  if (!cleaned.length) return undefined;
  return (
    <div
      className={cn(
        "flex max-w-[320px] flex-wrap items-end gap-2",
        forceLeftAlign
          ? "items-start justify-start text-left"
          : "justify-end text-right",
        singleItemPerRow ? "flex-col" : "",
      )}
    >
      {cleaned.map((value) => (
        <Badge
          key={value}
          variant="outline"
          className={cn("text-sm", forceLeftAlign ? "text-left" : "text-right")}
        >
          {value}
        </Badge>
      ))}
    </div>
  );
}

function getVideoNotes(item: GearItem): string | null {
  const extra = item.cameraSpecs?.extra;
  if (
    extra &&
    typeof extra === "object" &&
    extra !== null &&
    "videoNotes" in extra &&
    typeof (extra as Record<string, unknown>).videoNotes === "string"
  ) {
    const value = (
      (extra as Record<string, unknown>).videoNotes as string
    ).trim();
    return value.length ? value : null;
  }
  return null;
}

// ============================================================================
// TYPES
// ============================================================================

export type SpecFieldDef = {
  key: string; // Stable identifier (e.g., "announcedDate", "resolutionMp")
  label: string; // Human-readable label for display
  labelOverride?: (item: GearItem) => string; // Optional per-item label
  getRawValue: (item: GearItem) => unknown; // Extract raw value from GearItem
  formatDisplay?: (
    raw: unknown,
    item: GearItem,
    forceLeftAlign?: boolean,
    viewerRegion?: GearRegion | null,
  ) => React.ReactNode; // Format for display (table, etc.)
  editElementId?: string; // DOM id to focus in the edit UI when navigating from sidebar
  condition?: (item: GearItem) => boolean; // Optional: when to show this field
  condenseOnMobile?: boolean; // Whether to condense the field on mobile
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
        label: "Mount",
        labelOverride: (item) =>
          item.gearType === "LENS" &&
          item.mountIds?.length &&
          item.mountIds.length > 1
            ? "Mounts"
            : "Mount",
        getRawValue: (item) => {
          const ids =
            (Array.isArray(item.mountIds) && item.mountIds.length > 0
              ? item.mountIds
              : []) || (item.mountId ? [item.mountId] : []);
          return ids;
        },
        formatDisplay: (raw, item, forceLeftAlign) => {
          const ids = Array.isArray(raw) ? (raw as string[]) : [];
          if (!ids.length) return undefined;
          // Lenses show all mounts, cameras show first mount only (just as a safety)
          const selectedIds = item.gearType === "LENS" ? ids : [ids[0]!];
          const mountLabels = selectedIds
            .map((mountId) => getMountLongNameById(mountId))
            .filter(
              (mountName) =>
                typeof mountName === "string" && mountName.trim().length > 0,
            );
          if (!mountLabels.length) return undefined;
          if (mountLabels.length === 1) return mountLabels[0];
          return renderBadgeColumn(mountLabels, forceLeftAlign);
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
        key: "msrpAtLaunchUsdCents",
        label: "MSRP At Launch",
        getRawValue: (item) => item.msrpAtLaunchUsdCents,
        formatDisplay: (raw) => (raw ? formatPrice(raw as number) : undefined),
        editElementId: "msrpAtLaunch",
      },
      {
        key: "msrpNowUsdCents",
        label: "MSRP Now",
        getRawValue: (item) => item.msrpNowUsdCents,
        formatDisplay: (raw) => (raw ? formatPrice(raw as number) : undefined),
        editElementId: "msrpNow",
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
        condenseOnMobile: true,
        getRawValue: (item) => ({
          widthMm: item.widthMm,
          heightMm: item.heightMm,
          depthMm: item.depthMm,
        }),
        formatDisplay: (_, item) => {
          // Helper to coerce to number (or null) and format with up to 1 decimal
          const toNumber = (v: unknown): number | null => {
            if (typeof v === "number") return v;
            if (v == null) return null;
            const n = Number(v);
            return Number.isFinite(n) ? n : null;
          };
          const fmt = (n: number): string =>
            Number.isInteger(n) ? String(n) : String(Number(n.toFixed(1)));

          const width = toNumber(item.widthMm);
          const height = toNumber(item.heightMm);
          const depth = toNumber(item.depthMm);

          if (width == null && height == null && depth == null)
            return undefined;

          const DimensionRow = ({
            label,
            value,
          }: {
            label: string;
            value: number;
          }) => (
            <div className="flex min-w-[160px] items-center justify-between gap-2">
              <span className="text-muted-foreground">{label}</span>
              <span className="text-right font-medium">
                {fmt(value)}
                <span className="text-muted-foreground ml-1">mm</span>
              </span>
            </div>
          );

          // Lenses: show Diameter (from width or height) and Length (from depth)
          if (item.gearType === "LENS") {
            const diameter = width ?? height;
            const length = depth;
            return (
              <div className="flex w-fit flex-col items-end gap-1.5 text-right">
                {length != null && (
                  <DimensionRow label="Length" value={length} />
                )}
                {diameter != null && (
                  <DimensionRow label="Diameter" value={diameter} />
                )}
              </div>
            );
          }

          // Cameras/others: show Length (depth), Width, Height as a simple column
          return (
            <div className="flex w-fit flex-col items-end gap-1.5 text-right">
              {depth != null && <DimensionRow label="Length" value={depth} />}
              {width != null && <DimensionRow label="Width" value={width} />}
              {height != null && <DimensionRow label="Height" value={height} />}
            </div>
          );
        },
        editElementId: "widthMm",
      },
      {
        key: "regionalAliases",
        label: "Regional Names",
        condenseOnMobile: true,
        getRawValue: (item) => item.regionalAliases,
        formatDisplay: (
          raw,
          item,
          _forceLeftAlign,
          viewerRegion = "GLOBAL",
        ) => {
          const aliases = Array.isArray(raw) ? raw : [];
          if (!aliases.length) return undefined;

          const viewer = viewerRegion ?? "GLOBAL";
          const entries: Array<{ label: string; name: string }> = [];

          const findAlias = (region: GearRegion) =>
            aliases.find((a) => a.region === region)?.name?.trim();

          if (viewer !== "GLOBAL") {
            entries.push({ label: "Default Name", name: item.name });
          }

          const euAlias = findAlias("EU");
          if (euAlias && viewer !== "EU") {
            entries.push({ label: "EU Name", name: euAlias });
          }

          const jpAlias = findAlias("JP");
          if (jpAlias && viewer !== "JP") {
            entries.push({ label: "Japan Name", name: jpAlias });
          }

          if (!entries.length) return undefined;

          return (
            <div className="flex w-full max-w-[240px] flex-col gap-2">
              {entries.map((entry) => (
                <div
                  key={entry.label}
                  className="flex w-full items-center justify-between"
                >
                  <span className="text-muted-foreground">{entry.label}</span>
                  <span className="font-medium">{entry.name}</span>
                </div>
              ))}
            </div>
          );
        },
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
        key: "maxFpsByShutter",
        label: "Max Continuous FPS",
        condenseOnMobile: true,
        getRawValue: (item) => ({
          perShutter: item.cameraSpecs?.maxFpsByShutter,
          availableShutters: item.cameraSpecs?.availableShutterTypes,
          maxRaw: item.cameraSpecs?.maxFpsRaw,
          maxJpg: item.cameraSpecs?.maxFpsJpg,
        }),
        formatDisplay: (_, item) => formatMaxFpsDisplay(item),
        editElementId: "maxFpsByShutter",
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
            ? `${String(raw)} ms`
            : undefined,
      },
      {
        key: "hasIbis",
        label: "Has IBIS",
        getRawValue: (item) => item.cameraSpecs?.hasIbis,
        formatDisplay: (raw, item) =>
          typeof raw === "boolean"
            ? yesNoNull(raw, !supportsVideoMeaningfully(item))
            : undefined,
      },
      {
        key: "hasElectronicVibrationReduction",
        label: "Has Digital Stabilization",
        getRawValue: (item) =>
          item.cameraSpecs?.hasElectronicVibrationReduction,
        formatDisplay: (raw, item) =>
          typeof raw === "boolean" ? yesNoNull(raw, true) : undefined,
      },
      {
        key: "cipaStabilizationRatingStops",
        label: "CIPA Stabilization Rating Stops",
        getRawValue: (item) => item.cameraSpecs?.cipaStabilizationRatingStops,
        condition: (item) => item.cameraSpecs?.hasIbis === true,
        formatDisplay: (raw) =>
          typeof raw === "number" || typeof raw === "string"
            ? `${formatDecimalCompact(raw)} stops`
            : undefined,
      },
      {
        key: "hasPixelShiftShooting",
        label: "Has Pixel Shift Shooting",
        getRawValue: (item) => item.cameraSpecs?.hasPixelShiftShooting,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw, true) : undefined,
      },
      {
        key: "hasAntiAliasingFilter",
        label: "Has Anti Aliasing Filter",
        getRawValue: (item) => item.cameraSpecs?.hasAntiAliasingFilter,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
      },
      {
        key: "precaptureSupportLevel",
        label: "Precapture Buffer",
        getRawValue: (item) => item.cameraSpecs?.precaptureSupportLevel,
        formatDisplay: (raw) => formatPrecaptureSupport(raw),
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
          typeof raw === "boolean" ? yesNoNull(raw, true) : undefined,
      },
      {
        key: "availableShutterTypes",
        label: "Available Shutter Types",
        getRawValue: (item) => item.cameraSpecs?.availableShutterTypes,
        formatDisplay: (
          raw: unknown,
          _,
          forceLeftAlign,
        ): React.ReactNode | undefined => {
          if (!Array.isArray(raw)) return undefined;
          const entries = raw.reduce<string[]>((acc, value) => {
            if (typeof value !== "string") return acc;
            const trimmed = value.trim();
            if (!trimmed.length) return acc;
            const label = formatShutterType(trimmed) ?? trimmed;
            acc.push(label);
            return acc;
          }, []);
          return renderBadgeColumn(entries, forceLeftAlign);
        },
        editElementId: "availableShutterTypes",
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
      if (item.gearType !== "CAMERA" && item.gearType !== "ANALOG_CAMERA")
        return false;
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
          const { actual, equivalent } = formatFocalLengthRangeDisplay({
            isPrime: item.fixedLensSpecs?.isPrime,
            min: item.fixedLensSpecs?.focalLengthMinMm,
            max: item.fixedLensSpecs?.focalLengthMaxMm,
            imageCircleFormatId: item.fixedLensSpecs?.imageCircleSizeId,
            sensorFormatId: item.cameraSpecs?.sensorFormatId,
          });
          if (!actual) return undefined;
          return (
            <span className="flex items-center gap-1">
              {actual}
              {equivalent ? (
                <span className="text-muted-foreground">
                  {`(${equivalent} equiv.)`}
                </span>
              ) : null}
            </span>
          );
        },
      },
      {
        key: "fixedImageCircleSize",
        label: "Image Circle Size",
        getRawValue: (item) => item.fixedLensSpecs?.imageCircleSizeId,
        formatDisplay: (raw) =>
          typeof raw === "string" ? sensorNameFromId(raw) : undefined,
        editElementId: "fixed-image-circle-size",
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
  // CAMERA: HARDWARE/BUILD
  // ==========================================================================
  {
    id: "camera-hardware",
    title: "Hardware/Build",
    sectionAnchor: "camera-section",
    condition: (item) => item.gearType === "CAMERA",
    fields: [
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
        key: "internalStorageGb",
        label: "Internal Storage",
        getRawValue: (item) => item.cameraSpecs?.internalStorageGb,
        formatDisplay: (raw) => formatStorageGb(raw),
        editElementId: "internalStorageGb",
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
            four_axis_tilt_flip: "4 Axis Tilt-Flip",
            other: "Other",
          };
          return map[raw] ?? raw;
        },
      },
      {
        key: "rearDisplaySizeInches",
        label: "Rear Display Size",
        getRawValue: (item) => item.cameraSpecs?.rearDisplaySizeInches,
        // only show if the camera has a rear display
        condition: (item) => item.cameraSpecs?.rearDisplayType !== "none",
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
        // only show if the camera has a rear display
        condition: (item) => item.cameraSpecs?.rearDisplayType !== "none",
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
          typeof raw === "boolean" ? yesNoNull(raw, true) : undefined,
      },
      {
        key: "hasRearTouchscreen",
        label: "Has Rear Touchscreen",
        getRawValue: (item) => item.cameraSpecs?.hasRearTouchscreen,
        formatDisplay: (raw, item) =>
          typeof raw === "boolean"
            ? yesNoNull(raw, item.cameraSpecs?.rearDisplayType === "none")
            : undefined,
      },
      {
        key: "cardSlots",
        label: "Card Slots",
        getRawValue: (item) => item.cameraCardSlots,
        formatDisplay: (_, item, forceLeftAlign) => {
          if (!item.cameraCardSlots || item.cameraCardSlots.length === 0)
            return undefined;

          // Sort slots as in original
          const sortedCardSlots = item.cameraCardSlots
            .slice() // guard: don't mutate original
            .sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0));

          // Each card slot becomes one badge, label uses '|' separated "details".
          const badgeLabels = sortedCardSlots.map((s) => {
            const details = formatCardSlotDetails({
              slotIndex: s.slotIndex,
              supportedFormFactors: s.supportedFormFactors ?? [],
              supportedBuses: s.supportedBuses ?? [],
              supportedSpeedClasses: s.supportedSpeedClasses ?? [],
            });
            return details.length > 0 ? details : "Not specified";
          });

          return renderBadgeColumn(badgeLabels, forceLeftAlign, true);
        },
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
        key: "hasFocusPeaking",
        label: "Has Focus Peaking",
        getRawValue: (item) => item.cameraSpecs?.hasFocusPeaking,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw, true) : undefined,
      },
      {
        key: "hasFocusBracketing",
        label: "Has Focus Bracketing",
        getRawValue: (item) => item.cameraSpecs?.hasFocusBracketing,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw, true) : undefined,
      },
      {
        key: "afAreaModes",
        label: "AF Area Modes",
        getRawValue: (item) => item.cameraSpecs?.afAreaModes,
        formatDisplay: (raw, _, forceLeftAlign) => {
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
          return renderBadgeColumn(names, forceLeftAlign);
        },
        editElementId: "afAreaModes",
      },
      {
        key: "afSubjectCategories",
        label: "AF Subject Categories",
        getRawValue: (item) => item.cameraSpecs?.afSubjectCategories,
        formatDisplay: (raw, _, forceLeftAlign) => {
          if (!Array.isArray(raw)) return undefined;
          const categories = raw
            .map((value) => (typeof value === "string" ? value.trim() : ""))
            .filter((value) => value.length > 0)
            .map((value) => value.charAt(0).toUpperCase() + value.slice(1));
          return renderBadgeColumn(categories, forceLeftAlign);
        },
        editElementId: "afSubjectCategories",
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
        key: "usbCharging",
        label: "Supports USB Charging",
        getRawValue: (item) => item.cameraSpecs?.usbCharging,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw, true) : undefined,
      },
      {
        key: "usbPowerDelivery",
        label: "Supports USB Power Delivery",
        getRawValue: (item) => item.cameraSpecs?.usbPowerDelivery,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw, true) : undefined,
      },
      {
        key: "supportedBatteries",
        label: "Supported Batteries",
        getRawValue: (item) => item.cameraSpecs?.supportedBatteries,
        formatDisplay: (raw) => {
          if (!Array.isArray(raw) || raw.length === 0) return undefined;
          const list = raw
            .map((v) => (typeof v === "string" ? v.trim() : ""))
            .filter((s) => s.length > 0);
          if (list.length === 0) return undefined;
          return (
            <ul className="list-none space-y-1 text-left">
              {list.map((battery) => (
                <li key={battery}>{battery}</li>
              ))}
            </ul>
          );
        },
        editElementId: "supportedBatteries",
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
        key: "videoSummary",
        label: "Video Summary",
        condenseOnMobile: true,
        editElementId: "video-modes-manager",
        getRawValue: (item) => item.videoModes,
        formatDisplay: (_, item) => {
          const modes = coerceCameraVideoModes(item.videoModes);
          if (!modes.length) return undefined;
          const bundle = buildVideoDisplayBundle(modes);
          if (!bundle.summaryLines.length) return undefined;
          return (
            <VideoSpecsSummary
              summaryLines={bundle.summaryLines}
              matrix={bundle.matrix}
              codecLabels={bundle.codecLabels}
              videoNotes={getVideoNotes(item)}
            />
          );
        },
      },
      {
        key: "videoAvailableCodecs",
        label: "Available Codecs",
        getRawValue: (item) => item.videoModes,
        formatDisplay: (_, item) => {
          const list = Array.from(
            new Set(
              (item.videoModes ?? [])
                .map((mode) =>
                  typeof mode.codecLabel === "string"
                    ? mode.codecLabel.trim()
                    : "",
                )
                .filter((label) => label.length > 0),
            ),
          );
          if (!list.length) return undefined;
          return (
            <div className="flex flex-wrap gap-2">
              {list.map((label) => (
                <Badge key={label} variant="outline">
                  {label}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        key: "hasLogColorProfile",
        label: "Has Log Color Profile",
        getRawValue: (item) => item.cameraSpecs?.hasLogColorProfile,
        formatDisplay: (raw, item) =>
          typeof raw === "boolean"
            ? yesNoNull(raw, !supportsVideoMeaningfully(item))
            : undefined,
      },
      {
        key: "has10BitVideo",
        label: "Has 10 Bit Video",
        getRawValue: (item) => item.cameraSpecs?.has10BitVideo,
        formatDisplay: (raw, item) =>
          typeof raw === "boolean"
            ? yesNoNull(raw, !supportsVideoMeaningfully(item))
            : undefined,
      },
      {
        key: "has12BitVideo",
        label: "Has 12 Bit Video",
        getRawValue: (item) => item.cameraSpecs?.has12BitVideo,
        formatDisplay: (raw, item) =>
          typeof raw === "boolean"
            ? yesNoNull(
                raw,
                !supportsVideoMeaningfully(item) &&
                  item.cameraSpecs?.has10BitVideo !== true,
              )
            : undefined,
      },
      {
        key: "hasOpenGateVideo",
        label: "Has Open Gate Video",
        getRawValue: (item) => item.cameraSpecs?.hasOpenGateVideo,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw, true) : undefined,
      },
      {
        key: "supportsExternalRecording",
        label: "Supports External Recording",
        getRawValue: (item) => item.cameraSpecs?.supportsExternalRecording,
        formatDisplay: (raw, item) =>
          typeof raw === "boolean"
            ? yesNoNull(raw, !supportsVideoMeaningfully(item))
            : undefined,
      },
      {
        key: "supportsRecordToDrive",
        label: "Supports Recording to Drive",
        getRawValue: (item) => item.cameraSpecs?.supportsRecordToDrive,
        formatDisplay: (raw, item) =>
          typeof raw === "boolean"
            ? yesNoNull(raw, !supportsVideoMeaningfully(item))
            : undefined,
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
        formatDisplay: (raw) =>
          yesNoNull(raw as boolean | null | undefined, true),
      },
      {
        key: "hasHotShoe",
        label: "Has Hot Shoe",
        getRawValue: (item) => item.cameraSpecs?.hasHotShoe,
        formatDisplay: (raw) =>
          yesNoNull(raw as boolean | null | undefined, true),
      },
      {
        key: "hasUsbFileTransfer",
        label: "Has USB File Transfer",
        getRawValue: (item) => item.cameraSpecs?.hasUsbFileTransfer,
        formatDisplay: (raw) =>
          yesNoNull(raw as boolean | null | undefined, true),
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
          imageCircleFormatId: item.lensSpecs?.imageCircleSizeId,
        }),
        formatDisplay: (_, item) => {
          const { actual, equivalent } = formatFocalLengthRangeDisplay({
            isPrime: item.lensSpecs?.isPrime,
            min: item.lensSpecs?.focalLengthMinMm,
            max: item.lensSpecs?.focalLengthMaxMm,
            imageCircleFormatId: item.lensSpecs?.imageCircleSizeId,
          });
          if (!actual) return undefined;
          if (!equivalent) return actual;
          return (
            <span className="flex items-center gap-1">
              {actual}
              <span className="text-muted-foreground">{`(${equivalent} equiv.)`}</span>
            </span>
          );
        },
      },
      {
        key: "imageCircleSize",
        label: "Image Circle Size",
        getRawValue: (item) => item.lensSpecs?.imageCircleSizeId,
        formatDisplay: (raw) =>
          typeof raw === "string" ? sensorNameFromId(raw) : undefined,
        editElementId: "imageCircleSize",
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
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
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
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
      },
      {
        key: "hasApertureRing",
        label: "Has Aperture Ring",
        getRawValue: (item) => item.lensSpecs?.hasApertureRing,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
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
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
      },
      {
        key: "focusMotorType",
        label: "Focus Motor Type",
        getRawValue: (item) => item.lensSpecs?.focusMotorType,
        formatDisplay: (raw, item) => {
          if (item.lensSpecs?.hasAutofocus !== true) return undefined;
          return typeof raw === "string" ? (raw as string) : undefined;
        },
      },
      {
        key: "hasAfMfSwitch",
        label: "Has AF/MF Switch",
        getRawValue: (item) => item.lensSpecs?.hasAfMfSwitch,
        formatDisplay: (raw, item) => {
          return typeof raw === "boolean" ? yesNoNull(raw) : undefined;
        },
        condition: (item) => item.lensSpecs?.hasAutofocus === true,
      },
      {
        key: "hasFocusLimiter",
        label: "Has Focus Limiter",
        getRawValue: (item) => item.lensSpecs?.hasFocusLimiter,
        formatDisplay: (raw, item) => {
          if (item.lensSpecs?.hasAutofocus !== true) return undefined;
          return typeof raw === "boolean" ? yesNoNull(raw, true) : undefined;
        },
        condition: (item) => item.lensSpecs?.hasAutofocus === true,
      },
      {
        key: "hasFocusRecallButton",
        label: "Has Focus Recall Button",
        getRawValue: (item) => item.lensSpecs?.hasFocusRecallButton,
        formatDisplay: (raw, item) => {
          return typeof raw === "boolean" ? yesNoNull(raw, true) : undefined;
        },
        condition: (item) => item.lensSpecs?.hasAutofocus === true,
      },
      {
        key: "hasFocusRing",
        label: "Has Focus Ring",
        getRawValue: (item) => item.lensSpecs?.hasFocusRing,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
      },
      {
        key: "hasInternalFocus",
        label: "Has Internal Focus",
        getRawValue: (item) => item.lensSpecs?.hasInternalFocus,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
      },
      {
        key: "frontElementRotates",
        label: "Front Element Rotates",
        getRawValue: (item) => item.lensSpecs?.frontElementRotates,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
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
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
      },
      {
        key: "hasStabilizationSwitch",
        label: "Has Stabilization Switch",
        getRawValue: (item) => item.lensSpecs?.hasStabilizationSwitch,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
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
        // only show if the lens is not a prime lens
        condition: (item) => item.lensSpecs?.isPrime === false,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
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
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
      },
      {
        key: "numberCustomControlRings",
        label: "Number of Custom Control Rings",
        getRawValue: (item) => item.lensSpecs?.numberCustomControlRings,
        // only show if the lens has custom control rings
        condition: (item) =>
          item.lensSpecs?.numberCustomControlRings != null &&
          item.lensSpecs?.numberCustomControlRings > 0,
      },
      {
        key: "numberFunctionButtons",
        label: "Number of Function Buttons",
        getRawValue: (item) => item.lensSpecs?.numberFunctionButtons,
        // only show if the lens has function buttons
        condition: (item) =>
          item.lensSpecs?.numberFunctionButtons != null &&
          item.lensSpecs?.numberFunctionButtons > 0,
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
          typeof raw === "boolean" ? yesNoNull(raw, true) : undefined,
      },
      {
        key: "hasLensHood",
        label: "Has Lens Hood",
        getRawValue: (item) => item.lensSpecs?.hasLensHood,
        formatDisplay: (raw) =>
          typeof raw === "boolean" ? yesNoNull(raw) : undefined,
      },
      {
        key: "hasTripodCollar",
        label: "Has Tripod Collar/Lens Foot",
        getRawValue: (item) => item.lensSpecs?.hasTripodCollar,
        formatDisplay: (raw, item) => {
          const focalLengthMax = item.lensSpecs?.focalLengthMaxMm ?? 0;
          // if the lens has max focal length under 200 we should hide the row when false
          return typeof raw === "boolean"
            ? yesNoNull(raw, focalLengthMax < 200)
            : undefined;
        },
      },
    ],
  },

  // ==========================================================================
  // ANALOG CAMERAS
  // ==========================================================================
  {
    id: "analog-camera",
    title: "Analog Camera",
    sectionAnchor: "analog-camera-section",
    condition: (item) => item.gearType === "ANALOG_CAMERA",
    fields: [
      {
        key: "cameraType",
        label: "Camera Type",
        getRawValue: (item) => item.analogCameraSpecs?.cameraType,
        formatDisplay: (raw) => formatAnalogCameraType(raw as string),
      },
      {
        key: "captureMedium",
        label: "Capture Medium",
        getRawValue: (item) => item.analogCameraSpecs?.captureMedium,
        formatDisplay: (raw) => formatAnalogMedium(raw as string),
      },
      {
        key: "filmTransportType",
        label: "Film Transport",
        getRawValue: (item) => item.analogCameraSpecs?.filmTransportType,
        formatDisplay: (raw) => formatAnalogFilmTransport(raw as string),
      },
      {
        key: "viewfinderType",
        label: "Viewfinder Type",
        getRawValue: (item) => item.analogCameraSpecs?.viewfinderType,
        formatDisplay: (raw) => formatAnalogViewfinderType(raw as string),
      },
      {
        key: "shutterType",
        label: "Shutter Type",
        getRawValue: (item) => item.analogCameraSpecs?.shutterType,
        formatDisplay: (raw) => formatAnalogShutterType(raw as string),
      },
      {
        key: "shutterSpeeds",
        label: "Shutter Speeds",
        getRawValue: (item) => ({
          min: item.analogCameraSpecs?.shutterSpeedMin,
          max: item.analogCameraSpecs?.shutterSpeedMax,
        }),
        formatDisplay: (_, item) => {
          const min = item.analogCameraSpecs?.shutterSpeedMin ?? null;
          const max = item.analogCameraSpecs?.shutterSpeedMax ?? null;
          if (min == null && max == null) return undefined;
          const maxText = max != null ? `${max}s` : "";
          const minText = min != null ? `1/${min}s` : "";
          if (maxText && minText) return `${maxText} to ${minText}`;
          return maxText || minText || undefined;
        },
      },
      {
        key: "flashSyncSpeed",
        label: "Flash Sync Speed",
        getRawValue: (item) => item.analogCameraSpecs?.flashSyncSpeed,
        formatDisplay: (raw) =>
          raw != null ? `1/${Number(raw as number)}s` : undefined,
      },
      {
        key: "hasBulbMode",
        label: "Bulb Mode",
        getRawValue: (item) => item.analogCameraSpecs?.hasBulbMode,
        formatDisplay: (raw) => yesNoNull(raw as any),
      },
      {
        key: "hasMetering",
        label: "Has Metering",
        getRawValue: (item) => item.analogCameraSpecs?.hasMetering,
        formatDisplay: (raw) => yesNoNull(raw as any),
      },
      {
        key: "meteringModes",
        label: "Metering Modes",
        getRawValue: (item) => item.analogCameraSpecs?.meteringModes ?? [],
        // only show if the camera has metering
        condition: (item) => item.analogCameraSpecs?.hasMetering === true,
        formatDisplay: (raw) =>
          Array.isArray(raw)
            ? renderBadgeColumn(
                (raw as string[]).map((r) => formatAnalogMeteringMode(r) ?? r),
                true,
                true,
              )
            : undefined,
      },
      {
        key: "meteringDisplayTypes",
        label: "Metering Display",
        getRawValue: (item) =>
          item.analogCameraSpecs?.meteringDisplayTypes ?? [],
        // only show if the camera has metering
        condition: (item) => item.analogCameraSpecs?.hasMetering === true,
        formatDisplay: (raw) =>
          Array.isArray(raw)
            ? renderBadgeColumn(
                (raw as string[]).map(
                  (r) => formatAnalogMeteringDisplay(r) ?? r,
                ),
                true,
                true,
              )
            : undefined,
      },
      {
        key: "exposureModes",
        label: "Exposure Modes",
        getRawValue: (item) => item.analogCameraSpecs?.exposureModes ?? [],
        formatDisplay: (raw) =>
          Array.isArray(raw)
            ? renderBadgeColumn(
                (raw as string[]).map((r) => formatAnalogExposureMode(r) ?? r),
                true,
                true,
              )
            : undefined,
      },
      {
        key: "isoSettingMethod",
        label: "ISO Setting",
        getRawValue: (item) => item.analogCameraSpecs?.isoSettingMethod,
        formatDisplay: (raw) => formatAnalogIsoSettingMethod(raw as string),
      },
      {
        key: "isoRange",
        label: "ISO Range",
        getRawValue: (item) => ({
          min: item.analogCameraSpecs?.isoMin,
          max: item.analogCameraSpecs?.isoMax,
        }),
        formatDisplay: (_, item) => {
          const min = item.analogCameraSpecs?.isoMin ?? null;
          const max = item.analogCameraSpecs?.isoMax ?? null;
          if (min == null && max == null) return undefined;
          if (min != null && max != null) return `${min} - ${max}`;
          return (min ?? max)?.toString();
        },
      },
      {
        key: "hasExposureCompensation",
        label: "Exposure Compensation",
        getRawValue: (item) => item.analogCameraSpecs?.hasExposureCompensation,
        formatDisplay: (raw) => yesNoNull(raw as any),
      },
      {
        key: "hasAutoFocus",
        label: "Autofocus",
        getRawValue: (item) => item.analogCameraSpecs?.hasAutoFocus,
        formatDisplay: (raw) => yesNoNull(raw as any),
      },
      {
        key: "focusAidTypes",
        label: "Focus Aids",
        getRawValue: (item) => item.analogCameraSpecs?.focusAidTypes ?? [],
        formatDisplay: (raw) =>
          Array.isArray(raw)
            ? renderBadgeColumn(
                (raw as string[]).map((r) => formatAnalogFocusAid(r) ?? r),
                true,
                true,
              )
            : undefined,
      },
      {
        key: "hasContinuousDrive",
        label: "Continuous Drive",
        getRawValue: (item) => item.analogCameraSpecs?.hasContinuousDrive,
        formatDisplay: (raw) => yesNoNull(raw as any),
      },
      {
        key: "maxContinuousFps",
        label: "Max FPS",
        getRawValue: (item) => item.analogCameraSpecs?.maxContinuousFps,
        // only show if the camera has continuous drive
        condition: (item) =>
          item.analogCameraSpecs?.hasContinuousDrive === true,
        formatDisplay: (raw) =>
          raw != null ? `${Number(raw as number)} FPS` : undefined,
      },
      {
        key: "requiresBatteryForShutter",
        label: "Battery Required (Shutter)",
        getRawValue: (item) =>
          item.analogCameraSpecs?.requiresBatteryForShutter,
        formatDisplay: (raw) => yesNoNull(raw as any),
      },
      {
        key: "requiresBatteryForMetering",
        label: "Battery Required (Metering)",
        getRawValue: (item) =>
          item.analogCameraSpecs?.requiresBatteryForMetering,
        // only show if camera has metering
        condition: (item) => item.analogCameraSpecs?.hasMetering === true,
        formatDisplay: (raw) => yesNoNull(raw as any),
      },
      {
        key: "supportedBatteries",
        label: "Supported Batteries",
        getRawValue: (item) => item.analogCameraSpecs?.supportedBatteries,
        formatDisplay: (raw) => {
          if (!raw) return undefined;
          const arr = raw as string[];
          if (!Array.isArray(arr) || arr.length === 0) return undefined;
          return arr.join(", ");
        },
        // only show if there are batteries
        condition: (item) =>
          Array.isArray(item.analogCameraSpecs?.supportedBatteries) &&
          (item.analogCameraSpecs?.supportedBatteries as string[]).length > 0,
        editElementId: "supportedBatteries",
      },
      {
        key: "hasHotShoe",
        label: "Hot Shoe",
        getRawValue: (item) => item.analogCameraSpecs?.hasHotShoe,
        formatDisplay: (raw) => yesNoNull(raw as any),
      },
      {
        key: "hasSelfTimer",
        label: "Self Timer",
        getRawValue: (item) => item.analogCameraSpecs?.hasSelfTimer,
        formatDisplay: (raw) => yesNoNull(raw as any),
      },
      {
        key: "hasIntervalometer",
        label: "Intervalometer",
        getRawValue: (item) => item.analogCameraSpecs?.hasIntervalometer,
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
            <ul className="text-muted-foreground list-none space-y-1 text-sm">
              {list.map((note) => (
                <li key={note}>{note}</li>
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
export function buildGearSpecsSections(
  item: GearItem,
  options?:
    | boolean
    | { forceLeftAlign?: boolean; viewerRegion?: GearRegion | null },
): SpecsTableSection[] {
  const normalizedOptions =
    typeof options === "boolean"
      ? { forceLeftAlign: options }
      : (options ?? {});
  const forceLeftAlign = normalizedOptions.forceLeftAlign;
  const viewerRegion = normalizedOptions.viewerRegion ?? "GLOBAL";
  return specDictionary
    .filter((section) => !section.condition || section.condition(item))
    .map((section) => ({
      title: section.title,
      data: section.fields
        .filter((field) => !field.condition || field.condition(item))
        .map((field) => {
          const raw = field.getRawValue(item);
          const value = field.formatDisplay
            ? field.formatDisplay(raw, item, forceLeftAlign, viewerRegion)
            : (raw as React.ReactNode);
          const label = field.labelOverride
            ? field.labelOverride(item)
            : field.label;
          return {
            label,
            value: value,
            fullWidth: !label,
            condenseOnMobile: field.condenseOnMobile,
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
        .map((field) => {
          const label = field.labelOverride
            ? field.labelOverride(item)
            : field.label;
          return {
            key: field.key,
            label,
            rawValue: field.getRawValue(item),
            targetId: field.editElementId ?? field.key,
          };
        }),
    }));
}

/**
 * Fetch a spec field definition by its key.
 * Useful for table rendering so callers can reuse getRawValue and formatDisplay.
 */
export function getSpecFieldDefByKey(
  fieldKey: string,
): SpecFieldDef | undefined {
  for (const section of specDictionary) {
    for (const field of section.fields) {
      if (field.key === fieldKey) {
        return field;
      }
    }
  }
  return undefined;
}
