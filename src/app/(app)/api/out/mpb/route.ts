import "server-only";

import { db } from "~/server/db";
import { gear } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { buildMpbPartnerizeUrl, type Market } from "~/lib/links/mpb";

const EU_COUNTRIES = new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
]);

function parseMarketParam(value: string | null): Market | null {
  if (!value) return null;
  const normalized = value.toUpperCase();
  if (normalized === "US") return "US";
  if (normalized === "UK" || normalized === "GB") return "UK";
  if (normalized === "EU") return "EU";
  return null;
}

function detectMarketFromCountryCode(alpha2Value: string | null): Market {
  if (!alpha2Value) return "US";
  const normalized = alpha2Value.toUpperCase();
  if (normalized === "UK" || normalized === "GB") return "UK";
  if (normalized === "EU" || EU_COUNTRIES.has(normalized)) return "EU";
  return "US";
}

async function resolveGearLinkMpb({
  slug,
  gearId,
}: {
  slug?: string | null;
  gearId?: string | null;
}): Promise<string | null> {
  if (!slug && !gearId) return null;
  const row = await db
    .select({ linkMpb: gear.linkMpb })
    .from(gear)
    .where(slug ? eq(gear.slug, slug) : eq(gear.id, gearId ?? ""))
    .limit(1);
  return row[0]?.linkMpb ?? null;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const params = url.searchParams;
  console.log("MPB out request received", { url: request.url });
  const marketParam = parseMarketParam(params.get("market"));
  const pubref = params.get("pubref") ?? undefined;
  const destinationPathParam = params.get("destinationPath");
  const gearSlug = params.get("gearSlug");
  const gearId = params.get("gearId");

  const headerList = await headers();
  const headerCountry =
    headerList.get("x-vercel-ip-country") ??
    headerList.get("x-geo-country") ??
    headerList.get("x-edge-country");
  const detectMarket = detectMarketFromCountryCode(headerCountry);
  const market = marketParam ?? detectMarket;
  console.log("MPB out market resolved", {
    marketParam,
    headerCountry,
    detectMarket,
    selectedMarket: market,
  });

  let destinationPath = destinationPathParam ?? undefined;
  if (!destinationPath && (gearSlug || gearId)) {
    destinationPath =
      (await resolveGearLinkMpb({ slug: gearSlug, gearId })) ?? undefined;
    console.log("MPB out resolved destinationPath from db", {
      gearSlug,
      gearId,
      destinationPath,
    });
  }

  if (!destinationPath) {
    return NextResponse.json(
      {
        message:
          "Missing destinationPath or gear reference with a valid MPB link.",
      },
      { status: 400 },
    );
  }

  const redirectUrl = buildMpbPartnerizeUrl({
    market,
    destinationPath,
    pubref,
  });
  console.log("MPB out redirecting", {
    destinationPath,
    pubref,
    redirectUrl,
  });

  return NextResponse.redirect(redirectUrl);
}
