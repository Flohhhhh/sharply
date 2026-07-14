import { runDeveloperApiRequest } from "~/server/developer-api/http";
import { serializeSearchResponse } from "~/server/developer-api/serializers";
import { parseSearchParams } from "~/server/developer-api/schemas";
import { searchDeveloperApi } from "~/server/developer-api/service";

export async function GET(request: Request) {
  return runDeveloperApiRequest(request, "search", async () => {
    const { query, page, limit } = parseSearchParams(
      new URL(request.url).searchParams,
    );
    return serializeSearchResponse(
      await searchDeveloperApi(query, page, limit),
    );
  });
}
