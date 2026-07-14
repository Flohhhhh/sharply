import { runDeveloperApiRequest } from "~/server/developer-api/http";
import { serializeSuggestions } from "~/server/developer-api/serializers";
import { parseSuggestionParams } from "~/server/developer-api/schemas";
import { getDeveloperSuggestions } from "~/server/developer-api/service";

export async function GET(request: Request) {
  return runDeveloperApiRequest(request, "suggestions", async () => {
    const { query, limit, region } = parseSuggestionParams(
      new URL(request.url).searchParams,
    );
    return serializeSuggestions(
      await getDeveloperSuggestions(query, limit, region),
    );
  });
}
