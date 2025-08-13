import { SENSOR_FORMATS } from "~/lib/constants";

export function sensorNameFromSlug(slug: string | null | undefined): string {
  if (!slug) return "Unknown";
  const match = SENSOR_FORMATS.find((f: any) => f.slug === slug);
  return match?.name ?? slug;
}

export function sensorNameFromId(id: string | null | undefined): string {
  if (!id) return "Unknown";
  const match = SENSOR_FORMATS.find((f: any) => f.id === id);
  return match?.name ?? id;
}
