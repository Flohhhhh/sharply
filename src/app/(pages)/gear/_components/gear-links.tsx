"use client";

import { Button } from "~/components/ui/button";
import Link from "next/link";
import { formatPrice } from "~/lib/mapping";

interface GearLinksProps {
  slug: string;
  linkManufacturer: string | null;
  linkMpb: string | null;
  linkAmazon: string | null;
  mpbMaxPriceUsdCents?: number | null;
}

export function GearLinks({
  slug,
  linkManufacturer,
  linkMpb,
  linkAmazon,
  mpbMaxPriceUsdCents,
}: GearLinksProps) {
  const hasAny = !!(linkManufacturer || linkMpb || linkAmazon);

  const report = (kind: string, url: string) => {
    // Placeholder until we wire this up to an API/event
    // eslint-disable-next-line no-console
    console.log("[report-broken-link]", { slug, kind, url });
  };

  if (!hasAny) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Links</h2>
      </div>

      {linkManufacturer && (
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-col">
            <span className="text-muted-foreground">Manufacturer</span>
            <a
              href={linkManufacturer}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary truncate font-medium hover:underline"
            >
              {linkManufacturer}
            </a>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => report("manufacturer", linkManufacturer)}
          >
            Report broken link
          </Button>
        </div>
      )}
      {linkMpb && (
        <Button variant="outline" asChild className="w-full">
          <Link href={linkMpb} target="_blank" rel="noopener noreferrer">
            {typeof mpbMaxPriceUsdCents === "number" ? (
              <>
                <span className="font-bold text-[#FF006B]">MPB</span>
                {" - "}
                {formatPrice(mpbMaxPriceUsdCents)}
              </>
            ) : (
              <>
                <span className="text-muted-foreground">MPB</span> See on MPB
              </>
            )}
          </Link>
        </Button>
      )}
      {linkAmazon && (
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-col">
            <span className="text-muted-foreground">Amazon</span>
            <a
              href={linkAmazon}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary truncate font-medium hover:underline"
            >
              {linkAmazon}
            </a>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => report("amazon", linkAmazon)}
          >
            Report broken link
          </Button>
        </div>
      )}
    </div>
  );
}

export default GearLinks;
