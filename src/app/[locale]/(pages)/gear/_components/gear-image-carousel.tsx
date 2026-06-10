"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";
import { GetGearDisplayName } from "~/lib/gear/naming";
import type { GearAlias } from "~/types/gear";
import { RequestImageButton } from "./request-image-button";

interface GearImageCarouselProps {
  name: string;
  regionalAliases?: GearAlias[] | null;
  thumbnailUrl: string | null;
  topViewUrl: string | null;
  rearViewUrl: string | null;
  slug: string;
  hasImageRequest: boolean | null;
}

export function GearImageCarousel({
  name,
  regionalAliases,
  thumbnailUrl,
  topViewUrl,
  rearViewUrl,
  slug,
  hasImageRequest,
}: GearImageCarouselProps) {
  const t = useTranslations("gearDetail");
  const gearImagesT = useTranslations("gearDetail.gearImages");
  const displayName = GetGearDisplayName({ name, regionalAliases });
  const imageCount = [thumbnailUrl, topViewUrl, rearViewUrl].filter(
    Boolean,
  ).length;

  if (imageCount === 0) {
    return (
      <div className="bg-muted dark:bg-card flex aspect-video flex-col items-center justify-center gap-1 rounded-md">
        <span className="text-muted-foreground text-lg">
          {t("noImageAvailable")}
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
                  alt={gearImagesT("topViewAlt", { name: displayName })}
                  className="h-full w-full max-w-[600px] object-contain"
                  width={720}
                  height={480}
                />
              </div>
            </CarouselItem>
          )}
          {rearViewUrl && (
            <CarouselItem>
              <div className="bg-muted dark:bg-card flex h-[300px] items-center justify-center overflow-hidden rounded-md p-8 sm:h-[600px] sm:p-12">
                <Image
                  src={rearViewUrl}
                  alt={gearImagesT("rearViewAlt", { name: displayName })}
                  className="h-full w-full max-w-[600px] object-contain"
                  width={720}
                  height={480}
                />
              </div>
            </CarouselItem>
          )}
        </CarouselContent>
        {imageCount > 1 && (
          <>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </>
        )}
      </Carousel>
    </div>
  );
}
