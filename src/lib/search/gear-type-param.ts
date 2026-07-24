export type SearchGearTypeUiValue =
  | "camera"
  | "lens"
  | "analog-camera"
  | "all";

export type SearchGearTypeApiValue = "CAMERA" | "LENS" | "ANALOG_CAMERA";

export function normalizeSearchGearTypeForUi(
  value: string | null | undefined,
): SearchGearTypeUiValue | null {
  switch (value?.trim()) {
    case "camera":
    case "CAMERA":
      return "camera";
    case "lens":
    case "LENS":
      return "lens";
    case "analog-camera":
    case "ANALOG_CAMERA":
      return "analog-camera";
    case "all":
      return "all";
    default:
      return null;
  }
}

export function normalizeSearchGearTypeForApi(
  value: string | null | undefined,
): SearchGearTypeApiValue | undefined {
  switch (normalizeSearchGearTypeForUi(value)) {
    case "camera":
      return "CAMERA";
    case "lens":
      return "LENS";
    case "analog-camera":
      return "ANALOG_CAMERA";
    default:
      return undefined;
  }
}
