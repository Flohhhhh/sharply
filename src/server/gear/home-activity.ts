type DateLike = Date | string | number;

export type GearActivityRow = {
  id: string;
  slug: string;
  name: string;
  createdAt: DateLike;
  updatedAt: DateLike;
  eventAt?: DateLike;
};

export type HomeActivityItem = {
  id: string;
  slug: string;
  name: string;
  eventType: "created" | "updated";
  eventAt: Date;
};

function toDate(value: DateLike): Date {
  return value instanceof Date ? value : new Date(value);
}

export function mapGearRowsToHomeActivityItems(
  rows: GearActivityRow[],
  limit = 5,
): HomeActivityItem[] {
  return rows
    .map((row) => {
      const createdAt = toDate(row.createdAt);
      const updatedAt = toDate(row.updatedAt);
      const eventType =
        updatedAt.getTime() > createdAt.getTime() ? "updated" : "created";
      const eventAt =
        row.eventAt != null
          ? toDate(row.eventAt)
          : eventType === "updated"
            ? updatedAt
            : createdAt;

      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        eventType,
        eventAt,
      } satisfies HomeActivityItem;
    })
    .sort((a, b) => b.eventAt.getTime() - a.eventAt.getTime())
    .slice(0, limit);
}
