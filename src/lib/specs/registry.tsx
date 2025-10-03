import type { SpecsTableSection } from "~/app/(app)/(pages)/gear/_components/specs-table";
import type { GearItem } from "~/types/gear";
import { formatHumanDateWithPrecision } from "~/lib/utils";
import {
  formatPrice,
  formatDimensions,
  formatCardSlotDetails,
} from "~/lib/mapping";
import {
  getMountLongNameById,
  getMountLongNamesById,
} from "~/lib/mapping/mounts-map";
import { sensorNameFromId, sensorTypeLabel } from "~/lib/mapping/sensor-map";
import { formatFocusDistance } from "~/lib/mapping/focus-distance-map";
import { formatFilterType } from "~/lib/mapping/filter-types-map";

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

export function buildGearSpecsSections(item: GearItem): SpecsTableSection[] {
  const cameraSpecsItem =
    item.gearType === "CAMERA" ? (item.cameraSpecs ?? null) : null;
  const lensSpecsItem =
    item.gearType === "LENS" ? (item.lensSpecs ?? null) : null;

  const core: SpecsTableSection = {
    title: "Basic Information",
    data: [
      // Lenses: show only Available Mounts (junction array or fallback)
      ...(item.gearType === "LENS"
        ? [
            {
              label: "Available Mounts",
              value: (() => {
                const ids =
                  (Array.isArray(item.mountIds) && item.mountIds.length > 0
                    ? item.mountIds
                    : []) || (item.mountId ? [item.mountId] : []);
                return ids.length ? getMountLongNamesById(ids) : undefined;
              })(),
            },
          ]
        : []),
      // Cameras: show Mount (single) from array or fallback to primary
      ...(item.gearType === "CAMERA"
        ? [
            {
              label: "Mount",
              value: (() => {
                const ids =
                  (Array.isArray(item.mountIds) && item.mountIds.length > 0
                    ? item.mountIds
                    : []) || (item.mountId ? [item.mountId] : []);
                return ids.length ? getMountLongNameById(ids[0]!) : undefined;
              })(),
            },
          ]
        : []),
      {
        label: "Announced",
        value: item.announcedDate
          ? formatHumanDateWithPrecision(
              item.announcedDate,
              (item as any).announceDatePrecision ?? "DAY",
            )
          : undefined,
      },
      {
        label: "Release Date",
        value: item.releaseDate
          ? formatHumanDateWithPrecision(
              item.releaseDate,
              (item as any).releaseDatePrecision ?? "DAY",
            )
          : undefined,
      },
      {
        label: "MSRP Now",
        value: item.msrpNowUsdCents
          ? formatPrice(item.msrpNowUsdCents)
          : undefined,
      },
      {
        label: "MSRP At Launch",
        value: item.msrpAtLaunchUsdCents
          ? formatPrice(item.msrpAtLaunchUsdCents)
          : undefined,
      },
      {
        label: "MPB Max Price",
        value: item.mpbMaxPriceUsdCents
          ? formatPrice(item.mpbMaxPriceUsdCents)
          : undefined,
      },
      {
        label: "Weight",
        value: item.weightGrams ? `${item.weightGrams} g` : undefined,
      },
      {
        label: "Dimensions",
        value:
          item.widthMm != null || item.heightMm != null || item.depthMm != null
            ? (() => {
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
              })()
            : undefined,
      },
    ],
  };

  const cameraSections: SpecsTableSection[] = [
    {
      title: "Sensor & Shutter",
      data: [
        {
          label: "Resolution",
          value:
            cameraSpecsItem?.resolutionMp != null
              ? `${Number(cameraSpecsItem.resolutionMp).toFixed(1)} megapixels`
              : undefined,
        },
        {
          label: "Sensor Format",
          value: cameraSpecsItem?.sensorFormatId
            ? sensorNameFromId(cameraSpecsItem?.sensorFormatId)
            : undefined,
        },
        {
          label: "ISO Range",
          value:
            cameraSpecsItem?.isoMin != null && cameraSpecsItem?.isoMax != null
              ? `ISO ${cameraSpecsItem.isoMin} - ${cameraSpecsItem.isoMax}`
              : undefined,
        },
        {
          label: "Max FPS (RAW)",
          value:
            cameraSpecsItem?.maxFpsRaw != null
              ? `${formatDecimalCompact(cameraSpecsItem.maxFpsRaw)} fps`
              : undefined,
        },
        {
          label: "Max FPS (JPEG)",
          value:
            cameraSpecsItem?.maxFpsJpg != null
              ? `${formatDecimalCompact(cameraSpecsItem.maxFpsJpg)} fps`
              : undefined,
        },
        {
          label: "Sensor Type",
          value: cameraSpecsItem
            ? (() => {
                const label = sensorTypeLabel(cameraSpecsItem);
                return label && label.trim().length > 0 ? label : undefined;
              })()
            : undefined,
        },
        {
          label: "Sensor Readout Speed",
          value: cameraSpecsItem?.sensorReadoutSpeedMs?.toString(),
        },
        {
          label: "Has IBIS",
          value: yesNoNull(cameraSpecsItem?.hasIbis ?? null),
        },
        {
          label: "Has Electronic VR",
          value: yesNoNull(
            cameraSpecsItem?.hasElectronicVibrationReduction ?? null,
          ),
        },
        {
          label: "CIPA Stabilization Rating Stops",
          value: cameraSpecsItem?.cipaStabilizationRatingStops?.toString(),
        },
        {
          label: "Has Pixel Shift Shooting",
          value: yesNoNull(cameraSpecsItem?.hasPixelShiftShooting ?? null),
        },
        {
          label: "Has Anti Aliasing Filter",
          value: yesNoNull(cameraSpecsItem?.hasAntiAliasingFilter ?? null),
        },
        {
          label: "Longest Shutter Speed",
          value:
            cameraSpecsItem?.shutterSpeedMax != null
              ? `${cameraSpecsItem.shutterSpeedMax} seconds`
              : undefined,
        },
        {
          label: "Fastest Shutter Speed",
          value:
            cameraSpecsItem?.shutterSpeedMin != null
              ? `1/${cameraSpecsItem.shutterSpeedMin}s`
              : undefined,
        },
        {
          label: "Flash Sync Speed",
          value:
            cameraSpecsItem?.flashSyncSpeed != null
              ? `1/${cameraSpecsItem.flashSyncSpeed}s`
              : undefined,
        },
        {
          label: "Has Silent Shooting Available",
          value: yesNoNull(cameraSpecsItem?.hasSilentShootingAvailable ?? null),
        },
        {
          label: "Available Shutter Types",
          value:
            Array.isArray(cameraSpecsItem?.availableShutterTypes) &&
            cameraSpecsItem.availableShutterTypes.length > 0
              ? cameraSpecsItem.availableShutterTypes.join(", ")
              : undefined,
        },
      ],
    },
    {
      title: "Hardware/Build",
      data: [
        {
          label: "Card Slots",
          value:
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
          label: "Processor Name",
          value: cameraSpecsItem?.processorName ?? undefined,
        },
        {
          label: "Weather Sealing",
          value: yesNoNull(cameraSpecsItem?.hasWeatherSealing ?? null),
        },
      ],
    },
    {
      title: "Focus",
      data: [
        {
          label: "Focus Points",
          value: cameraSpecsItem?.focusPoints?.toString(),
        },
        {
          label: "AF Subject Categories",
          value: cameraSpecsItem?.afSubjectCategories?.join(", "),
        },
        {
          label: "Has Focus Peaking",
          value: yesNoNull(cameraSpecsItem?.hasFocusPeaking ?? null),
        },
        {
          label: "Has Focus Bracketing",
          value: yesNoNull(cameraSpecsItem?.hasFocusBracketing ?? null),
        },
      ],
    },
    {
      title: "Battery & Charging",
      data: [
        {
          label: "CIPA Battery Shots Per Charge",
          value: cameraSpecsItem?.cipaBatteryShotsPerCharge?.toString(),
        },
        {
          label: "Supported Batteries",
          value: cameraSpecsItem?.supportedBatteries?.join(", "),
        },
        {
          label: "Supports USB Charging",
          value: yesNoNull(cameraSpecsItem?.usbCharging ?? null),
        },
        {
          label: "USB Power Delivery",
          value: yesNoNull(cameraSpecsItem?.usbPowerDelivery ?? null),
        },
      ],
    },
    {
      title: "Video",
      data: [
        {
          label: "Has Log Color Profile",
          value: yesNoNull(cameraSpecsItem?.hasLogColorProfile ?? null),
        },
        {
          label: "Has 10 Bit Video",
          value: yesNoNull(cameraSpecsItem?.has10BitVideo ?? null),
        },
        {
          label: "Has 12 Bit Video",
          value: yesNoNull(cameraSpecsItem?.has12BitVideo ?? null),
        },
      ],
    },
    {
      title: "Misc",
      data: [
        {
          label: "Has Intervalometer",
          value: yesNoNull(cameraSpecsItem?.hasIntervalometer ?? null),
        },
        {
          label: "Has Self Timer",
          value: yesNoNull(cameraSpecsItem?.hasSelfTimer ?? null),
        },
        {
          label: "Has Built In Flash",
          value: yesNoNull(cameraSpecsItem?.hasBuiltInFlash ?? null),
        },
        {
          label: "Has Hot Shoe",
          value: yesNoNull(cameraSpecsItem?.hasHotShoe ?? null),
        },
      ],
    },
  ];

  const lensSections: SpecsTableSection[] = [
    {
      title: "Tech Specs",
      data: [
        {
          label: "Lens Type",
          value: lensSpecsItem?.isPrime ? "Prime" : "Zoom",
        },
        {
          label: "Focal Length",
          value: lensSpecsItem?.isPrime
            ? `${lensSpecsItem?.focalLengthMinMm}mm`
            : `${lensSpecsItem?.focalLengthMinMm}mm - ${lensSpecsItem?.focalLengthMaxMm}mm`,
        },
        {
          label: "Maximum Aperture",
          value:
            lensSpecsItem?.maxApertureTele &&
            lensSpecsItem?.maxApertureTele !== lensSpecsItem?.maxApertureWide
              ? `f/${Number(lensSpecsItem?.maxApertureWide)} - f/${Number(lensSpecsItem?.maxApertureTele)}`
              : lensSpecsItem?.maxApertureWide != null
                ? `f/${Number(lensSpecsItem?.maxApertureWide)}`
                : undefined,
        },
        {
          label: "Minimum Aperture",
          value:
            lensSpecsItem?.minApertureTele &&
            lensSpecsItem?.minApertureTele !== lensSpecsItem?.minApertureWide
              ? `f/${Number(lensSpecsItem?.minApertureWide)} - f/${Number(lensSpecsItem?.minApertureTele)}`
              : lensSpecsItem?.minApertureWide != null
                ? `f/${Number(lensSpecsItem?.minApertureWide)}`
                : undefined,
        },
        {
          label: "Has Image Stabilization",
          value:
            lensSpecsItem?.hasStabilization != null
              ? lensSpecsItem?.hasStabilization
                ? "Yes"
                : "No"
              : undefined,
        },
        {
          label: "Has Stabilization Switch",
          value:
            lensSpecsItem?.hasStabilizationSwitch != null
              ? lensSpecsItem?.hasStabilizationSwitch
                ? "Yes"
                : "No"
              : undefined,
        },
        {
          label: "CIPA Stabilization Rating Stops",
          value:
            lensSpecsItem?.cipaStabilizationRatingStops != null
              ? `${lensSpecsItem?.cipaStabilizationRatingStops} stops`
              : undefined,
        },
        {
          label: "Has Autofocus",
          value:
            lensSpecsItem?.hasAutofocus != null
              ? lensSpecsItem?.hasAutofocus
                ? "Yes"
                : "No"
              : undefined,
        },
        {
          label: "Is Macro",
          value:
            lensSpecsItem?.isMacro != null
              ? lensSpecsItem?.isMacro
                ? "Yes"
                : "No"
              : undefined,
        },
        {
          label: "Magnification",
          value:
            lensSpecsItem?.magnification != null
              ? `${lensSpecsItem?.magnification}x`
              : undefined,
        },
        {
          label: "Minimum Focus Distance",
          value:
            lensSpecsItem?.minimumFocusDistanceMm != null
              ? formatFocusDistance(lensSpecsItem?.minimumFocusDistanceMm)
              : undefined,
        },
        {
          label: "Has Focus Ring",
          value:
            lensSpecsItem?.hasFocusRing != null
              ? lensSpecsItem?.hasFocusRing
                ? "Yes"
                : "No"
              : undefined,
        },
        {
          label: "Focus Motor Type",
          value: lensSpecsItem?.focusMotorType ?? undefined,
        },
        {
          label: "Has AF/MF Switch",
          value:
            lensSpecsItem?.hasAfMfSwitch != null
              ? lensSpecsItem?.hasAfMfSwitch
                ? "Yes"
                : "No"
              : undefined,
        },
        {
          label: "Has Focus Limiter",
          value:
            lensSpecsItem?.hasFocusLimiter != null
              ? lensSpecsItem?.hasFocusLimiter
                ? "Yes"
                : "No"
              : undefined,
        },
        {
          label: "Has Focus Recall Button",
          value:
            lensSpecsItem?.hasFocusRecallButton != null
              ? lensSpecsItem?.hasFocusRecallButton
                ? "Yes"
                : "No"
              : undefined,
        },
        { label: "Number of Elements", value: lensSpecsItem?.numberElements },
        {
          label: "Number of Element Groups",
          value: lensSpecsItem?.numberElementGroups,
        },
        {
          label: "Has Diffractive Optics",
          value:
            lensSpecsItem?.hasDiffractiveOptics != null
              ? lensSpecsItem?.hasDiffractiveOptics
                ? "Yes"
                : "No"
              : undefined,
        },
        {
          label: "Number of Diaphragm Blades",
          value: lensSpecsItem?.numberDiaphragmBlades,
        },
        {
          label: "Has Rounded Diaphragm Blades",
          value:
            lensSpecsItem?.hasRoundedDiaphragmBlades != null
              ? lensSpecsItem?.hasRoundedDiaphragmBlades
                ? "Yes"
                : "No"
              : undefined,
        },
        {
          label: "Has Internal Zoom",
          value:
            lensSpecsItem?.hasInternalZoom != null
              ? lensSpecsItem?.hasInternalZoom
                ? "Yes"
                : "No"
              : undefined,
        },
        {
          label: "Has Internal Focus",
          value:
            lensSpecsItem?.hasInternalFocus != null
              ? lensSpecsItem?.hasInternalFocus
                ? "Yes"
                : "No"
              : undefined,
        },
        {
          label: "Front Element Rotates",
          value:
            lensSpecsItem?.frontElementRotates != null
              ? lensSpecsItem?.frontElementRotates
                ? "Yes"
                : "No"
              : undefined,
        },
        {
          label: "Mount Material",
          value:
            lensSpecsItem?.mountMaterial != null
              ? lensSpecsItem.mountMaterial.charAt(0).toUpperCase() +
                lensSpecsItem.mountMaterial.slice(1)
              : undefined,
        },
        {
          label: "Has Weather Sealing",
          value:
            lensSpecsItem?.hasWeatherSealing != null
              ? lensSpecsItem?.hasWeatherSealing
                ? "Yes"
                : "No"
              : undefined,
        },
        {
          label: "Has Aperture Ring",
          value:
            lensSpecsItem?.hasApertureRing != null
              ? lensSpecsItem?.hasApertureRing
                ? "Yes"
                : "No"
              : undefined,
        },
        {
          label: "Number of Custom Control Rings",
          value: lensSpecsItem?.numberCustomControlRings,
        },
        {
          label: "Number of Function Buttons",
          value: lensSpecsItem?.numberFunctionButtons,
        },
        {
          label: "Accepts Filter Types",
          value:
            Array.isArray(lensSpecsItem?.acceptsFilterTypes) &&
            lensSpecsItem.acceptsFilterTypes.length > 0
              ? lensSpecsItem.acceptsFilterTypes
                  .map(formatFilterType)
                  .join(", ")
              : undefined,
        },
        {
          label: "Front Filter Thread Size",
          value:
            lensSpecsItem?.frontFilterThreadSizeMm != null &&
            lensSpecsItem?.acceptsFilterTypes?.includes("front-screw-on")
              ? `${lensSpecsItem.frontFilterThreadSizeMm}mm`
              : undefined,
        },
        {
          label: "Rear Filter Thread Size",
          value:
            lensSpecsItem?.rearFilterThreadSizeMm != null &&
            lensSpecsItem?.acceptsFilterTypes?.includes("rear-screw-on")
              ? `${lensSpecsItem.rearFilterThreadSizeMm}mm`
              : undefined,
        },
        {
          label: "Drop In Filter Size",
          value:
            lensSpecsItem?.dropInFilterSizeMm != null &&
            lensSpecsItem?.acceptsFilterTypes?.includes("rear-drop-in")
              ? `${lensSpecsItem.dropInFilterSizeMm}mm`
              : undefined,
        },
        {
          label: "Has Built In Teleconverter",
          value:
            lensSpecsItem?.hasBuiltInTeleconverter != null
              ? lensSpecsItem?.hasBuiltInTeleconverter
                ? "Yes"
                : "No"
              : undefined,
        },
        {
          label: "Has Lens Hood",
          value:
            lensSpecsItem?.hasLensHood != null
              ? lensSpecsItem?.hasLensHood
                ? "Yes"
                : "No"
              : undefined,
        },
        {
          label: "Has Tripod Collar/Lens Foot",
          value:
            lensSpecsItem?.hasTripodCollar != null
              ? lensSpecsItem?.hasTripodCollar
                ? "Yes"
                : "No"
              : undefined,
        },
      ],
    },
  ];

  const sections =
    item.gearType === "CAMERA"
      ? [core, ...cameraSections]
      : [core, ...lensSections];

  // Filter out rows with non-displayable values at registry level
  return sections.map((section) => ({
    ...section,
    data: section.data.filter((row) => hasDisplayValue(row.value)),
  }));
}
