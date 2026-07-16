import { runDeveloperApiRequest } from "~/server/developer-api/http";
import { getDeveloperRandomLowCompletionGearUrl } from "~/server/developer-api/service";

export async function GET(request: Request) {
  return runDeveloperApiRequest(request, "gear", async () => ({
    data: { url: await getDeveloperRandomLowCompletionGearUrl() },
    headers: { "Cache-Control": "no-store" },
  }));
}
