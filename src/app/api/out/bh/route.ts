import { type NextRequest, NextResponse } from "next/server";
import { track } from "@vercel/analytics/server";
import { getBhDestinationUrl } from "~/lib/links/bhphoto";

const URL_QUERY_PARAMETER = "url";
const SLUG_QUERY_PARAMETER = "slug";

/**
 * Redirect to the B&H destination URL after validating the provided link.
 */
export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get(URL_QUERY_PARAMETER);

  if (!rawUrl) {
    return NextResponse.json(
      { error: "Missing B&H URL value" },
      { status: 400 },
    );
  }

  const slug = request.nextUrl.searchParams.get(SLUG_QUERY_PARAMETER)?.trim();

  try {
    const destinationUrl = getBhDestinationUrl(rawUrl);
    const trackPayload: Record<string, string> = {
      destinationUrl,
    };
    if (slug) {
      trackPayload.slug = slug;
    }
    await track("bhphoto_redirect", trackPayload);
    return NextResponse.redirect(destinationUrl, 307);
  } catch {
    return NextResponse.json({ error: "Invalid B&H URL" }, { status: 400 });
  }
}

