const PRIORITY_SENSOR_FORMAT_SLUGS = [
  "full-frame",
  "aps-c",
  "micro-4-3",
  "medium-format-crop",
  "medium-format-full",
  "cinema-large-format",
] as const;

type SensorFormatLike = {
  slug: string;
  name: string;
};

const prioritySensorFormatOrder = new Map(
  PRIORITY_SENSOR_FORMAT_SLUGS.map((slug, index) => [slug, index]),
);

export function sortSensorFormats<T extends SensorFormatLike>(formats: T[]): T[] {
  return [...formats].sort((a, b) => {
    const aPriority = prioritySensorFormatOrder.get(a.slug);
    const bPriority = prioritySensorFormatOrder.get(b.slug);

    if (aPriority != null && bPriority != null) return aPriority - bPriority;
    if (aPriority != null) return -1;
    if (bPriority != null) return 1;

    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}
