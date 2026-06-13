import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import messages from "../../messages/en.json";
import { GearImageCarousel } from "../../src/app/[locale]/(pages)/gear/_components/gear-image-carousel";

vi.mock("server-only", () => ({}));
vi.mock("next/image", () => ({
  default: ({
    alt,
    priority: _priority,
    src,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) =>
    React.createElement("img", { alt, src, ...props }),
}));
vi.mock("~/server/gear/actions", () => ({
  actionToggleImageRequest: vi.fn(),
}));

vi.mock("~/components/ui/carousel", () => ({
  Carousel: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "carousel" }, children),
  CarouselContent: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "carousel-content" }, children),
  CarouselItem: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "carousel-item" }, children),
  CarouselPrevious: () =>
    React.createElement("button", { "data-testid": "carousel-previous" }),
  CarouselNext: () =>
    React.createElement("button", { "data-testid": "carousel-next" }),
}));

function renderCarousel(
  props: Partial<React.ComponentProps<typeof GearImageCarousel>> = {},
) {
  return renderToStaticMarkup(
    React.createElement(NextIntlClientProvider, {
      locale: "en",
      messages,
      timeZone: "America/New_York",
      children: React.createElement(GearImageCarousel, {
        name: "Nikon Zf",
        gearType: "CAMERA",
        thumbnailUrl: null,
        topViewUrl: null,
        rearViewUrl: null,
        slug: "nikon-zf",
        hasImageRequest: false,
        ...props,
      }),
    }),
  );
}

describe("GearImageCarousel", () => {
  it("renders the no-image label from the gear images namespace", () => {
    const markup = renderCarousel();

    expect(markup).toContain("No image available");
  });

  it("keeps the request image control hidden during initial hydration", () => {
    const markup = renderCarousel({
      hasImageRequest: null,
    });

    expect(markup).not.toContain("Request Image");
    expect(markup).not.toContain(
      "Click below to help us prioritize this image!",
    );
  });

  it("renders the rear view when it is the only available image", () => {
    const markup = renderCarousel({
      rearViewUrl: "https://cdn.example.com/rear.webp",
    });

    expect(markup).toContain("https://cdn.example.com/rear.webp");
    expect(markup).toContain("Nikon Zf - Rear View");
    expect(markup).not.toContain('data-testid="carousel-previous"');
    expect(markup).not.toContain('data-testid="carousel-next"');
  });

  it("ignores rear view for lenses", () => {
    const markup = renderCarousel({
      gearType: "LENS",
      thumbnailUrl: "https://cdn.example.com/front.webp",
      rearViewUrl: "https://cdn.example.com/rear.webp",
    });

    expect(markup).toContain("https://cdn.example.com/front.webp");
    expect(markup).not.toContain("https://cdn.example.com/rear.webp");
    expect(markup).not.toContain("Rear View");
    expect(markup).not.toContain('data-testid="carousel-previous"');
    expect(markup).not.toContain('data-testid="carousel-next"');
  });

  it("renders front, top, and rear images in order", () => {
    const markup = renderCarousel({
      thumbnailUrl: "https://cdn.example.com/front.webp",
      topViewUrl: "https://cdn.example.com/top.webp",
      rearViewUrl: "https://cdn.example.com/rear.webp",
    });

    const frontIndex = markup.indexOf("https://cdn.example.com/front.webp");
    const topIndex = markup.indexOf("https://cdn.example.com/top.webp");
    const rearIndex = markup.indexOf("https://cdn.example.com/rear.webp");

    expect(frontIndex).toBeGreaterThan(-1);
    expect(topIndex).toBeGreaterThan(frontIndex);
    expect(rearIndex).toBeGreaterThan(topIndex);
  });

  it("shows navigation controls when rear view is present with another image", () => {
    const markup = renderCarousel({
      thumbnailUrl: "https://cdn.example.com/front.webp",
      rearViewUrl: "https://cdn.example.com/rear.webp",
    });

    expect(markup).toContain('data-testid="carousel-previous"');
    expect(markup).toContain('data-testid="carousel-next"');
  });
});
