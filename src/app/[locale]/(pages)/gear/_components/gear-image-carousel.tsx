"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ColorwaySwatch } from "~/components/gear/colorway-swatch";
import { Button } from "~/components/ui/button";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";
import { GetGearDisplayName } from "~/lib/gear/naming";
import { cn } from "~/lib/utils";
import type { GearAlias, GearColorway, GearType } from "~/types/gear";
import { RequestImageButton } from "./request-image-button";

interface GearImageCarouselProps {
  name: string;
  gearType: GearType;
  regionalAliases?: GearAlias[] | null;
  thumbnailUrl: string | null;
  topViewUrl: string | null;
  rearViewUrl: string | null;
  slug: string;
  hasImageRequest: boolean | null;
  colorways?: GearColorway[] | null;
}

type CarouselSlide = {
  key: string;
  colorwayId?: string;
  imageType: "front" | "topView" | "rearView";
  url: string;
};

const EMPTY_COLORWAYS: GearColorway[] = [];

export function GearImageCarousel({
  name,
  gearType,
  regionalAliases,
  thumbnailUrl,
  topViewUrl,
  rearViewUrl,
  slug,
  hasImageRequest,
  colorways = EMPTY_COLORWAYS,
}: GearImageCarouselProps) {
  const gearImagesT = useTranslations("gearDetail.gearImages");
  const displayName = GetGearDisplayName({ name, regionalAliases });
  const supportsRearView =
    gearType === "CAMERA" || gearType === "ANALOG_CAMERA";
  const [api, setApi] = useState<CarouselApi>();
  const orderedColorways = useMemo(
    () => [...(colorways ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [colorways],
  );
  const visibleColorways = useMemo(
    () =>
      orderedColorways.filter(
        (colorway) =>
          colorway.frontImageUrl ||
          colorway.topViewUrl ||
          (supportsRearView && colorway.rearViewUrl),
      ),
    [orderedColorways, supportsRearView],
  );
  const colorwayHasImages = useMemo(
    () =>
      new Set(
        visibleColorways.map((colorway) => colorway.id),
      ),
    [visibleColorways],
  );
  const slides = useMemo<CarouselSlide[]>(() => {
    if (!orderedColorways.length) {
      const baseSlides: Array<CarouselSlide | null> = [
        thumbnailUrl
          ? {
              key: "base-front",
              imageType: "front" as const,
              url: thumbnailUrl,
            }
          : null,
        topViewUrl
          ? { key: "base-top", imageType: "topView" as const, url: topViewUrl }
          : null,
        supportsRearView && rearViewUrl
          ? {
              key: "base-rear",
              imageType: "rearView" as const,
              url: rearViewUrl,
            }
          : null,
      ];
      return baseSlides.filter((slide): slide is CarouselSlide =>
        Boolean(slide),
      );
    }

    return visibleColorways.flatMap((colorway) => {
      const candidates: Array<CarouselSlide | null> = [
        colorway.frontImageUrl
          ? {
              key: `${colorway.id}-front`,
              colorwayId: colorway.id,
              imageType: "front" as const,
              url: colorway.frontImageUrl,
            }
          : null,
        colorway.topViewUrl
          ? {
              key: `${colorway.id}-top`,
              colorwayId: colorway.id,
              imageType: "topView" as const,
              url: colorway.topViewUrl,
            }
          : null,
        supportsRearView && colorway.rearViewUrl
          ? {
              key: `${colorway.id}-rear`,
              colorwayId: colorway.id,
              imageType: "rearView" as const,
              url: colorway.rearViewUrl,
            }
          : null,
      ];
      return candidates.filter((slide): slide is CarouselSlide =>
        Boolean(slide),
      );
    });
  }, [
    orderedColorways,
    rearViewUrl,
    supportsRearView,
    thumbnailUrl,
    topViewUrl,
    visibleColorways,
  ]);
  const [selectedColorwayId, setSelectedColorwayId] = useState<string | null>(
    null,
  );
  const activeColorwayId = visibleColorways.some(
    (colorway) => colorway.id === selectedColorwayId,
  )
    ? selectedColorwayId
    : (visibleColorways[0]?.id ?? null);

  useEffect(() => {
    if (!api) return;
    const updateActive = () => {
      const selected = slides[api.selectedScrollSnap()];
      if (selected?.colorwayId) setSelectedColorwayId(selected.colorwayId);
    };
    updateActive();
    api.on("select", updateActive);
    api.on("reInit", updateActive);
    return () => {
      api.off("select", updateActive);
      api.off("reInit", updateActive);
    };
  }, [api, slides]);

  const colorwayButtons = orderedColorways.length ? (
    <fieldset className="mt-4 flex flex-wrap justify-start gap-2">
      <legend className="sr-only">{gearImagesT("colorwaysLabel")}</legend>
      {orderedColorways.map((colorway) => {
        const selected = activeColorwayId === colorway.id;
        const hasImages = colorwayHasImages.has(colorway.id);
        return (
          <Button
            key={colorway.id}
            type="button"
            size="sm"
            variant="outline"
            className={cn(
              "border-input bg-background hover:bg-accent/50",
              selected && "border-foreground/50 ring-foreground/50 ring-2",
            )}
            aria-pressed={selected}
            disabled={!hasImages}
            onClick={() => {
              const index = slides.findIndex(
                (slide) => slide.colorwayId === colorway.id,
              );
              if (index >= 0) api?.scrollTo(index);
            }}
          >
            <ColorwaySwatch
              colorA={colorway.swatchColorA}
              colorB={colorway.swatchColorB}
              size="sm"
              selected={false}
            />
            {colorway.name}
          </Button>
        );
      })}
    </fieldset>
  ) : null;

  if (slides.length === 0) {
    return (
      <div className="relative">
        <div className="bg-muted dark:bg-card flex aspect-video flex-col items-center justify-center gap-1 rounded-md">
          <span className="text-muted-foreground text-lg">
            {gearImagesT("noImageAvailable")}
          </span>
          <RequestImageButton
            slug={slug}
            initialHasRequested={hasImageRequest}
          />
        </div>
        {colorwayButtons}
      </div>
    );
  }

  return (
    <div className="relative">
      <Carousel className="w-full" setApi={setApi}>
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem key={slide.key}>
              <div className="bg-muted dark:bg-card flex h-[300px] items-center justify-center overflow-hidden rounded-md p-8 sm:h-[600px] sm:p-12">
                <Image
                  src={slide.url}
                  alt={
                    slide.imageType === "topView"
                      ? gearImagesT("topViewAlt", { name: displayName })
                      : slide.imageType === "rearView"
                        ? gearImagesT("rearViewAlt", { name: displayName })
                        : displayName
                  }
                  className="h-full w-full max-w-[600px] object-contain"
                  width={720}
                  height={480}
                  priority={index === 0}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {slides.length > 1 && (
          <>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </>
        )}
      </Carousel>
      {colorwayButtons}
    </div>
  );
}
