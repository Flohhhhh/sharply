import { runDeveloperApiRequest } from "~/server/developer-api/http";
import { getDeveloperApiSpecsCatalog } from "~/server/developer-api/specs";

export async function GET(request: Request) {
  return runDeveloperApiRequest(request, "gear", async () => ({
    data: { categories: getDeveloperApiSpecsCatalog() },
    headers: { "Cache-Control": "no-store" },
  }));
}
