import { SENSOR_FORMATS } from "~/lib/constants";
import type { SensorFormat } from "~/types/gear";

const FORMATS = SENSOR_FORMATS as Array<
  Pick<SensorFormat, "id" | "name" | "slug">
>;

export function sensorNameFromSlug(slug: string | null | undefined): string {
  if (!slug) return "Unknown";
  const match = FORMATS.find((f) => f.slug === slug);
  return match?.name ?? slug;
}

export function sensorNameFromId(id: string | null | undefined): string {
  if (!id) return "Unknown";
  const match = FORMATS.find((f) => f.id === id);
  return match?.name ?? id;
}
