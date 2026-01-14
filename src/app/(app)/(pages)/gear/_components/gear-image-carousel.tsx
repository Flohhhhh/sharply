"use client";

import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";

interface GearImageCarouselProps {
  name: string;
  thumbnailUrl: string | null;
  topViewUrl: string | null;
}

export function GearImageCarousel({
  name,
  thumbnailUrl,
  topViewUrl,
}: GearImageCarouselProps) {
  if (!thumbnailUrl && !topViewUrl) {
    return (
      <div className="bg-muted dark:bg-card flex aspect-video items-center justify-center rounded-md">
        <div className="text-muted-foreground text-lg">No image available</div>
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
                  alt={name}
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
                  alt={`${name} - Top View`}
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
