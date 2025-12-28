import { ENUMS } from "~/lib/constants";
import { humanizeKey } from "~/lib/utils";

type Option = { id: string; name: string };

const ANALOG_LABELS = {
  analog_types_enum: {
    "single-lens-reflex-slr": "Single-Lens Reflex (SLR)",
    rangefinder: "Rangefinder",
    "twin-lens-reflex-tlr": "Twin-Lens Reflex (TLR)",
    "point-and-shoot": "Point & Shoot",
    "large-format": "Large Format",
    "instant-film": "Instant Film",
    disposable: "Disposable",
    toy: "Toy Camera",
    stereo: "Stereo",
    panoramic: "Panoramic",
    folding: "Folding",
    box: "Box Camera",
    pinhole: "Pinhole",
    press: "Press Camera",
  },
  analog_medium_enum: {
    "35mm": "35mm Film",
    "half-frame": "Half Frame 35mm Film",
    "panoramic-35mm": "Panoramic 35mm Film",
    aps: "APS",
    "110": "110 Film",
    "126-instamatic": "126 Instamatic Film",
    "828": "828 Film",
    "120": "120 Film",
    "220": "220 Film",
    "127": "127 Film",
    "620": "620 Film",
    "large-format-4x5": "Large Format 4x5",
    "large-format-5x7": "Large Format 5x7",
    "large-format-8x10": "Large Format 8x10",
    "ultra-large-format": "Ultra Large Format",
    "sheet-film": "Sheet Film",
    "metal-plate": "Metal Plate",
    "glass-plate": "Glass Plate",
    "experimental-other": "Experimental / Other",
  },
  film_transport_enum: {
    "not-applicable": "Not Applicable",
    "manual-lever": "Manual Lever",
    "manual-knob": "Manual Knob",
    "manual-other": "Manual (Other)",
    motorized: "Motorized",
    other: "Other",
  },
  exposure_modes_enum: {
    manual: "Manual",
    "aperture-priority": "Aperture Priority",
    "shutter-priority": "Shutter Priority",
    program: "Program",
    auto: "Auto",
    other: "Other",
  },
  metering_mode_enum: {
    average: "Average",
    "center-weighted": "Center-Weighted",
    spot: "Spot",
    other: "Other",
  },
  metering_display_type_enum: {
    "needle-middle": "Needle (Center)",
    "needle-match": "Needle Match",
    "led-indicators": "LED Indicators",
    "led-scale": "LED Scale",
    "lcd-viewfinder": "LCD Viewfinder",
    "lcd-top-panel": "LCD Top Panel",
    none: "None",
    other: "Other",
  },
  focus_aid_enum: {
    none: "None",
    "split-prism": "Split Prism",
    microprism: "Microprism",
    "split-microprism": "Split + Microprism",
    "electronic-confirm": "Electronic Confirm",
    "electronic-directional": "Electronic Directional",
    "af-point": "AF Point",
  },
  shutter_type_enum: {
    "focal-plane-cloth": "Focal-Plane (Cloth)",
    "focal-plane-metal": "Focal-Plane (Metal)",
    "focal-plane-electronic": "Focal-Plane (Electronic)",
    leaf: "Leaf",
    rotary: "Rotary",
    none: "None",
    other: "Other",
  },
  iso_setting_method_enum: {
    manual: "Manual",
    "dx-only": "DX Only",
    "dx-with-override": "DX with Override",
    fixed: "Fixed",
    other: "Other",
  },
  analog_viewfinder_types_enum: {
    none: "None",
    pentaprism: "Pentaprism",
    pentamirror: "Pentamirror",
    "waist-level": "Waist-Level",
    "sports-finder": "Sports Finder",
    "rangefinder-style": "Rangefinder-Style",
    "ground-glass": "Ground Glass",
    other: "Other",
  },
} as const;

const mapEnumWithLabels = (
  values: readonly string[] | null | undefined,
  labels: Record<string, string>,
): Option[] =>
  (values ?? []).map((id) => ({
    id,
    name: labels[id] ?? humanizeKey(id),
  }));

export const ANALOG_OPTIONS = {
  cameraTypes: mapEnumWithLabels(
    ENUMS.analog_types_enum,
    ANALOG_LABELS.analog_types_enum,
  ),
  media: mapEnumWithLabels(
    ENUMS.analog_medium_enum,
    ANALOG_LABELS.analog_medium_enum,
  ),
  filmTransport: mapEnumWithLabels(
    ENUMS.film_transport_enum,
    ANALOG_LABELS.film_transport_enum,
  ),
  exposureModes: mapEnumWithLabels(
    ENUMS.exposure_modes_enum,
    ANALOG_LABELS.exposure_modes_enum,
  ),
  meteringModes: mapEnumWithLabels(
    ENUMS.metering_mode_enum,
    ANALOG_LABELS.metering_mode_enum,
  ),
  meteringDisplays: mapEnumWithLabels(
    ENUMS.metering_display_type_enum,
    ANALOG_LABELS.metering_display_type_enum,
  ),
  focusAids: mapEnumWithLabels(
    ENUMS.focus_aid_enum,
    ANALOG_LABELS.focus_aid_enum,
  ),
  shutterTypes: mapEnumWithLabels(
    ENUMS.shutter_type_enum,
    ANALOG_LABELS.shutter_type_enum,
  ),
  isoSettingMethods: mapEnumWithLabels(
    ENUMS.iso_setting_method_enum,
    ANALOG_LABELS.iso_setting_method_enum,
  ),
  viewfinderTypes: mapEnumWithLabels(
    ENUMS.analog_viewfinder_types_enum,
    ANALOG_LABELS.analog_viewfinder_types_enum,
  ),
} as const;

const formatFromLabels = (
  labels: Record<string, string>,
  value: string | null | undefined,
): string | undefined => {
  if (!value) return undefined;
  return labels[value] ?? humanizeKey(value);
};

export const analogLabel = (
  enumKey: keyof typeof ANALOG_LABELS,
  id: string,
): string => {
  const labels = ANALOG_LABELS[enumKey] as Record<string, string>;
  return labels?.[id] ?? humanizeKey(id);
};

export const formatAnalogCameraType = (value: string | null | undefined) =>
  formatFromLabels(ANALOG_LABELS.analog_types_enum, value);
export const formatAnalogMedium = (value: string | null | undefined) =>
  formatFromLabels(ANALOG_LABELS.analog_medium_enum, value);
export const formatAnalogFilmTransport = (value: string | null | undefined) =>
  formatFromLabels(ANALOG_LABELS.film_transport_enum, value);
export const formatAnalogExposureMode = (value: string | null | undefined) =>
  formatFromLabels(ANALOG_LABELS.exposure_modes_enum, value);
export const formatAnalogMeteringMode = (value: string | null | undefined) =>
  formatFromLabels(ANALOG_LABELS.metering_mode_enum, value);
export const formatAnalogMeteringDisplay = (value: string | null | undefined) =>
  formatFromLabels(ANALOG_LABELS.metering_display_type_enum, value);
export const formatAnalogFocusAid = (value: string | null | undefined) =>
  formatFromLabels(ANALOG_LABELS.focus_aid_enum, value);
export const formatAnalogShutterType = (value: string | null | undefined) =>
  formatFromLabels(ANALOG_LABELS.shutter_type_enum, value);
export const formatAnalogIsoSettingMethod = (
  value: string | null | undefined,
) => formatFromLabels(ANALOG_LABELS.iso_setting_method_enum, value);
export const formatAnalogViewfinderType = (value: string | null | undefined) =>
  formatFromLabels(ANALOG_LABELS.analog_viewfinder_types_enum, value);
