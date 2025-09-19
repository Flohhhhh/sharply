import { fetchTopComparePairs } from "~/server/popularity/service";

export async function TopComparePairs() {
  const rows = await fetchTopComparePairs(20);

  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        No comparison data yet.
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-x-auto overflow-y-auto rounded-md border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted sticky top-0 z-10">
          <tr>
            <th className="px-3 py-2">Pair</th>
            <th className="px-3 py-2">Compares</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={`${r.gearAId}-${r.gearBId}`}
              className="hover:bg-muted/50 border-t"
            >
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <a
                    className="hover:underline"
                    href={`/gear/${r.a.slug}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {r.a.name}
                  </a>
                  <span className="text-muted-foreground">vs</span>
                  <a
                    className="hover:underline"
                    href={`/gear/${r.b.slug}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {r.b.name}
                  </a>
                </div>
              </td>
              <td className="px-3 py-2 tabular-nums">{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
