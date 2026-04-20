import { fetchAllImageRequests } from "~/server/gear/service";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export async function ImageRequestsList() {
  const requests = await fetchAllImageRequests();
  const sortedRequests = [...requests].sort(
    (first, second) => second.requestCount - first.requestCount,
  );

  if (requests.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        No image requests yet.
      </div>
    );
  }

  // Render requests in a sortable-style table so counts and recency are easy to scan
  return (
    <div className="max-h-96 overflow-x-auto overflow-y-auto rounded-md border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted sticky top-0 z-10">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Requests</th>
            <th className="px-3 py-2">Last request</th>
          </tr>
        </thead>
        <tbody>
          {sortedRequests.map((request) => (
            <tr key={request.gearId} className="hover:bg-muted/50 border-t">
              <td className="px-3 py-2">
                <Link
                  href={`/gear/${request.gearSlug}`}
                  className="hover:underline font-medium"
                >
                  {request.gearName}
                </Link>
              </td>
              <td className="px-3 py-2 tabular-nums">{request.requestCount}</td>
              <td className="px-3 py-2 text-muted-foreground">
                {formatDistanceToNow(new Date(request.latestRequestDate), {
                  addSuffix: true,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
