import { DeveloperApiError } from "~/server/developer-api/errors";
import { runDeveloperApiRequest } from "~/server/developer-api/http";
import { serializeDeveloperApiSpecs } from "~/server/developer-api/serializers";
import { parseSpecSelectors } from "~/server/developer-api/schemas";
import { getDeveloperGearSelectedSpecs } from "~/server/developer-api/specs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  return runDeveloperApiRequest(request, "gear", async () => {
    const { slug } = await params;
    if (!slug.trim() || slug.length > 220) {
      throw new DeveloperApiError(
        "invalid_request",
        400,
        "A valid gear slug is required.",
      );
    }
    const selectors = parseSpecSelectors(new URL(request.url).searchParams);
    return {
      ...serializeDeveloperApiSpecs(
        await getDeveloperGearSelectedSpecs({ slug, selectors }),
      ),
      headers: { "Cache-Control": "no-store" },
    };
  });
}
