import { runDeveloperApiRequest } from "~/server/developer-api/http";
import {
  createDeveloperCatalogEtag,
  getDeveloperCatalogSnapshot,
  matchesDeveloperCatalogEtag,
} from "~/server/developer-api/service";

const CATALOG_CACHE_HEADERS = {
  "Cache-Control": "private, max-age=0, must-revalidate",
  Vary: "Authorization, If-None-Match",
};

export async function GET(request: Request) {
  return runDeveloperApiRequest(request, "catalog", async () => {
    const snapshot = await getDeveloperCatalogSnapshot();
    const etag = createDeveloperCatalogEtag(snapshot.version);
    const headers = { ...CATALOG_CACHE_HEADERS, ETag: etag };

    if (
      matchesDeveloperCatalogEtag(request.headers.get("if-none-match"), etag)
    ) {
      return { response: new Response(null, { status: 304, headers }) };
    }

    return { ...snapshot, headers };
  });
}
