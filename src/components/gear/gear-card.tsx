"use client";

import Link from "next/link";
import { cn } from "~/lib/utils";
import { AddToCompareButton } from "~/components/compare/add-to-compare-button";
import Image from "next/image";
import { ImageOff } from "lucide-react";

export type GearCardProps = {
  href: string;
  slug: string;
  name: string;
  brandName?: string | null;
  thumbnailUrl?: string | null;
  gearType?: string | null;
  dateText?: string | null;
  topLeftLabel?: string | null;
  metaRight?: React.ReactNode;
  badges?: React.ReactNode;
  className?: string;
};

// TODO: Need to work on what information is showed on these cards, might vary based on where they are used
// should so badges, trending, etc. in some places.
export function GearCard(props: GearCardProps) {
  const {
    href,
    slug,
    name,
    brandName,
    thumbnailUrl,
    gearType,
    dateText,
    topLeftLabel,
    metaRight,
    badges,
    className,
  } = props;

  return (
    <div className={cn("group relative", className)}>
      {/* Outer card with hover-thicker border */}
      <Link
        href={href}
        className={cn(
          "border-input bg-card/50 hover:border-foreground/40 block rounded-2xl border transition-all",
          "shadow-sm hover:shadow-md",
        )}
      >
        {/* Inset surface (border removed) */}
        <div className="bg-background rounded-2xl p-2">
          {/* Image area */}
          <div className="bg-muted relative aspect-video overflow-hidden rounded-xl p-4">
            {topLeftLabel ? (
              <div className="absolute top-2 left-2 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                {topLeftLabel}
              </div>
            ) : null}
            {thumbnailUrl ? (
              // Transparent gear on gray background expected
              <Image
                src={thumbnailUrl}
                alt={name}
                width={560}
                height={320}
                className="h-full w-full object-cover transition-opacity group-hover:opacity-50"
                unoptimized
              />
            ) : (
              <div className="text-muted-foreground/50 flex h-full w-full items-center justify-center text-xl font-bold">
                {name}
              </div>
            )}

            {/* Hover actions overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-start justify-center p-2 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="pointer-events-auto w-full">
                <AddToCompareButton
                  slug={slug}
                  name={name}
                  gearType={gearType ?? undefined}
                  size="sm"
                  className="w-full cursor-pointer"
                  showLabel
                />
              </div>
            </div>
          </div>

          {/* Content below image */}
          <div className="mt-3 space-y-2 px-1.5 pb-1 transition-opacity group-hover:opacity-50">
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                {brandName ? <span>{brandName}</span> : null}
              </div>
              {metaRight ? (
                <span className="bg-secondary rounded-full px-2 py-1 text-xs">
                  {metaRight}
                </span>
              ) : null}
            </div>

            <div className="text-foreground truncate text-lg font-semibold">
              {name}
            </div>

            {badges}

            {dateText ? (
              <div className="text-muted-foreground text-xs">{dateText}</div>
            ) : null}
          </div>
        </div>
      </Link>
    </div>
  );
}
