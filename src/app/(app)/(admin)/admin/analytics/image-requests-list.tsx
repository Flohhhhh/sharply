import { fetchAllImageRequests } from "~/server/gear/data";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export async function ImageRequestsList() {
  const requests = await fetchAllImageRequests();

  if (requests.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        No image requests yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {requests.map((request) => (
        <div
          key={request.gearId}
          className="flex items-center justify-between rounded-md border p-4"
        >
          <div className="flex-1">
            <Link
              href={`/gear/${request.gearSlug}`}
              className="hover:underline font-medium"
            >
              {request.gearName}
            </Link>
            <div className="text-muted-foreground text-sm mt-1">
              {request.requestCount} {request.requestCount === 1 ? "request" : "requests"}
              {" · "}
              Last request{" "}
              {formatDistanceToNow(new Date(request.latestRequestDate), {
                addSuffix: true,
              })}
            </div>
          </div>
          <Link href={`/gear/${request.gearSlug}`}>
            <span className="text-sm text-blue-600 hover:underline">
              View Item →
            </span>
          </Link>
        </div>
      ))}
    </div>
  );
}
