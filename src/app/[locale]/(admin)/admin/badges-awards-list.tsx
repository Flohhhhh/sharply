import { fetchRecentAwards } from "~/server/badges/service";

export async function BadgesAwardsList() {
  const rows = await fetchRecentAwards(50);
  return (
    <div className="max-h-80 space-y-2 overflow-y-auto">
      {rows.map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between rounded-md border p-2 text-sm"
        >
          <div className="flex flex-col">
            <span className="font-medium">{r.badgeKey}</span>
            <span className="text-muted-foreground">
              user: {r.userId ?? "—"} • event: {r.eventType} • source:{" "}
              {r.source}
            </span>
          </div>
          <div className="text-muted-foreground">
            {new Date(r.awardedAt).toLocaleString()}
          </div>
        </div>
      ))}
      {rows.length === 0 && (
        <div className="text-muted-foreground text-sm">No awards yet.</div>
      )}
    </div>
  );
}
