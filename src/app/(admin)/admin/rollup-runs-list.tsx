import { db } from "~/server/db";
import { rollupRuns } from "~/server/db/schema";
import { desc } from "drizzle-orm";

export async function RollupRunsList() {
  const rows = await db
    .select()
    .from(rollupRuns)
    .orderBy(desc(rollupRuns.createdAt))
    .limit(50);

  if (rows.length === 0) {
    return <div className="text-muted-foreground text-sm">No runs yet.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-2">Created</th>
            <th className="px-3 py-2">asOf</th>
            <th className="px-3 py-2">corrected</th>
            <th className="px-3 py-2">daily rows</th>
            <th className="px-3 py-2">late</th>
            <th className="px-3 py-2">windows</th>
            <th className="px-3 py-2">lifetime rows</th>
            <th className="px-3 py-2">ms</th>
            <th className="px-3 py-2">status</th>
            <th className="px-3 py-2">error</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="px-3 py-2">
                {new Date(r.createdAt!).toISOString()}
              </td>
              <td className="px-3 py-2">{String(r.asOfDate)}</td>
              <td className="px-3 py-2">{String(r.correctedDate)}</td>
              <td className="px-3 py-2 tabular-nums">{r.dailyRows}</td>
              <td className="px-3 py-2 tabular-nums">{r.lateArrivals}</td>
              <td className="px-3 py-2 tabular-nums">{r.windowsRows}</td>
              <td className="px-3 py-2 tabular-nums">{r.lifetimeTotalRows}</td>
              <td className="px-3 py-2 tabular-nums">{r.durationMs}</td>
              <td className="px-3 py-2">{r.success ? "✅" : "❌"}</td>
              <td className="max-w-[280px] truncate px-3 py-2">
                {r.error ?? ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
