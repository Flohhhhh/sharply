import { SENSOR_FORMATS } from "~/lib/constants";
import type { CameraSpecs, SensorFormat } from "~/types/gear";

// const FORMATS = SENSOR_FORMATS as Array<
//   Pick<SensorFormat, "id" | "name" | "slug">
// >;

export function sensorNameFromSlug(slug: string | null | undefined): string {
  if (!slug) return "Unknown";
  const match = SENSOR_FORMATS.find((f) => f.slug === slug);
  return match?.name ?? slug;
}

export function sensorNameFromId(id: string | null | undefined): string {
  if (!id) return "Unknown";
  const match = SENSOR_FORMATS.find((f) => f.id === id);
  if (!match) {
    console.log("[sensorNameFromId] no match found for id", id);
    return "Unknown";
  }
  return match?.name;
}

export function sensorSlugFromId(
  id: string | null | undefined,
): string | undefined {
  if (!id) return undefined;
  const match = SENSOR_FORMATS.find((f) => f.id === id);
  return match?.slug;
}

export function sensorTypeLabel(cameraSpecs: CameraSpecs): string {
  if (!cameraSpecs) {
    console.log("[sensorTypeLabel] cameraSpecs is null");
    return "";
  }
  console.log("[sensorTypeLabel] generating label for cameraSpecs");
  const parts: string[] = [];
  const stacking = cameraSpecs.sensorStackingType as
    | "unstacked"
    | "partially-stacked"
    | "fully-stacked"
    | null
    | undefined;
  if (stacking && stacking !== "unstacked") {
    console.log("[sensorTypeLabel] is stacked");
    let stackingLabel: string | null = null;
    if (stacking === "partially-stacked") stackingLabel = "Partially-Stacked";
    if (stacking === "fully-stacked") stackingLabel = "Stacked";
    if (stackingLabel) parts.push(stackingLabel);
  }
  const tech = cameraSpecs.sensorTechType
    ? String(cameraSpecs.sensorTechType).toUpperCase()
    : null;
  const bsi = cameraSpecs.isBackSideIlluminated ? "BSI" : null;
  const techSegment = [bsi, tech].filter(Boolean).join("-");
  if (techSegment) parts.push(techSegment);
  console.log("[sensorTypeLabel] parts", parts);
  return parts.length ? parts.join(" ") : "";
}
