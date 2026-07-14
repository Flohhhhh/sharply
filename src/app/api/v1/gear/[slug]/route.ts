import { runDeveloperApiRequest } from "~/server/developer-api/http";
import { serializeGear } from "~/server/developer-api/serializers";
import { DeveloperApiError } from "~/server/developer-api/errors";
import { getDeveloperGear } from "~/server/developer-api/service";

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
    return serializeGear(await getDeveloperGear(slug));
  });
}
