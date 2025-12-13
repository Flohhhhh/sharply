import { NextRequest, NextResponse } from "next/server";
import { getAmazonDestinationUrl } from "~/lib/links/amazon";
import { parseAmazonAsin } from "~/lib/validation/amazon";
import { track } from "@vercel/analytics/server";

const ASIN_QUERY_PARAMETER = "asin";
const SLUG_QUERY_PARAMETER = "slug";

/**
 * Redirect to the Amazon destination URL for the requested ASIN.
 */
export async function GET(request: NextRequest) {
  const rawAsin = request.nextUrl.searchParams.get(ASIN_QUERY_PARAMETER);
  const asin = parseAmazonAsin(rawAsin);

  if (!asin) {
    return NextResponse.json(
      { error: "Missing or invalid ASIN value" },
      { status: 400 },
    );
  }

  const slug = request.nextUrl.searchParams.get(SLUG_QUERY_PARAMETER)?.trim();

  try {
    const destinationUrl = getAmazonDestinationUrl(asin);
    await track("amazon_redirect", {
      asin,
      destinationUrl,
      slug: slug || undefined,
    });
    return NextResponse.redirect(destinationUrl, 307);
  } catch {
    return NextResponse.json({ error: "Invalid ASIN value" }, { status: 400 });
  }
}
