"use client";

import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";
import { RequestImageButton } from "./request-image-button";
import { GetGearDisplayName } from "~/lib/gear/naming";
import type { GearAlias } from "~/types/gear";

interface GearImageCarouselProps {
  name: string;
  regionalAliases?: GearAlias[] | null;
  thumbnailUrl: string | null;
  topViewUrl: string | null;
  slug: string;
  hasImageRequest: boolean | null;
}

export function GearImageCarousel({
  name,
  regionalAliases,
  thumbnailUrl,
  topViewUrl,
  slug,
  hasImageRequest,
}: GearImageCarouselProps) {
  const displayName = GetGearDisplayName({ name, regionalAliases });
  if (!thumbnailUrl && !topViewUrl) {
    return (
      <div className="bg-muted dark:bg-card flex aspect-video flex-col items-center justify-center gap-1 rounded-md">
        <span className="text-muted-foreground text-lg">
          No image available
        </span>
        <RequestImageButton slug={slug} initialHasRequested={hasImageRequest} />
      </div>
    );
  }

  return (
    <div className="relative">
      <Carousel className="w-full">
        <CarouselContent>
          {thumbnailUrl && (
            <CarouselItem>
              <div className="bg-muted dark:bg-card flex h-[300px] items-center justify-center overflow-hidden rounded-md p-8 sm:h-[600px] sm:p-12">
                <Image
                  src={thumbnailUrl}
                  alt={displayName}
                  className="h-full w-full max-w-[600px] object-contain"
                  width={720}
                  height={480}
                  priority
                />
              </div>
            </CarouselItem>
          )}
          {topViewUrl && (
            <CarouselItem>
              <div className="bg-muted dark:bg-card flex h-[300px] items-center justify-center overflow-hidden rounded-md p-8 sm:h-[600px] sm:p-12">
                <Image
                  src={topViewUrl}
                  alt={`${displayName} - Top View`}
                  className="h-full w-full max-w-[600px] object-contain"
                  width={720}
                  height={480}
                />
              </div>
            </CarouselItem>
          )}
        </CarouselContent>
        {thumbnailUrl && topViewUrl && (
          <>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </>
        )}
      </Carousel>
    </div>
  );
}
