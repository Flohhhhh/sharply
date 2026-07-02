import "server-only";

import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  type CanonMirrorlessVariant,
  getMpbDestinationUrl,
  isMpbSearchInput,
  type Market,
  type SonyMirrorlessVariant,
} from "~/lib/links/mpb";
import { resolveGearLinkMpb } from "~/server/gear/service";

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
  if (normalized === "DE") return "DE";
  if (normalized === "FR") return "FR";
  if (normalized === "ES") return "ES";
  if (normalized === "IT") return "IT";
  if (normalized === "EU") return "EU";
  return null;
}

function detectMarketFromCountryCode(alpha2Value: string | null): Market {
  if (!alpha2Value) return "US";
  const normalized = alpha2Value.toUpperCase();
  if (normalized === "UK" || normalized === "GB") return "UK";
  if (normalized === "DE") return "DE";
  if (normalized === "FR") return "FR";
  if (normalized === "ES") return "ES";
  if (normalized === "IT") return "IT";
  if (normalized === "EU" || EU_COUNTRIES.has(normalized)) return "EU";
  return "US";
}

async function fetchGearLinkMpbFromService({
  slug,
  gearId,
}: {
  slug?: string | null;
  gearId?: string | null;
}): Promise<string | null> {
  return resolveGearLinkMpb({
    slug,
    gearId,
  });
}

function parseSonyVariantParam(
  value: string | null,
): SonyMirrorlessVariant | null {
  if (value === "e" || value === "fe") return value;
  return null;
}

function parseCanonVariantParam(
  value: string | null,
): CanonMirrorlessVariant | null {
  if (value === "rf" || value === "rf-s") return value;
  return null;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const params = url.searchParams;
  console.log("MPB out request received", { url: request.url });
  const marketParam = parseMarketParam(params.get("market"));
  const destinationPathParam = params.get("destinationPath");
  const mountId = params.get("mountId");
  const sonyMirrorlessVariant = parseSonyVariantParam(params.get("sonyVariant"));
  const canonMirrorlessVariant = parseCanonVariantParam(
    params.get("canonVariant"),
  );
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
      (await fetchGearLinkMpbFromService({ slug: gearSlug, gearId })) ??
      undefined;
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

  if (isMpbSearchInput(destinationPath)) {
    try {
      const redirectUrl = getMpbDestinationUrl({
        market,
        destinationPath,
        sonyMirrorlessVariant,
        canonMirrorlessVariant,
      });
      return NextResponse.redirect(redirectUrl, 307);
    } catch (error) {
      console.error("MPB out rejected legacy search destinationPath", {
        destinationPath,
        error,
      });
      return NextResponse.json(
        {
          message: "Invalid MPB destinationPath.",
        },
        { status: 400 },
      );
    }
  }

  try {
    const redirectUrl = getMpbDestinationUrl({
      market,
      destinationPath,
      mountId,
      sonyMirrorlessVariant,
      canonMirrorlessVariant,
    });
    console.log("MPB out redirecting", {
      destinationPath,
      mountId,
      redirectUrl,
    });

    return NextResponse.redirect(redirectUrl, 307);
  } catch (error) {
    console.error("MPB out rejected destinationPath", {
      destinationPath,
      error,
    });
    return NextResponse.json(
      {
        message: "Invalid MPB destinationPath.",
      },
      { status: 400 },
    );
  }
}
