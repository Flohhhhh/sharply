// This wrapper is client-only to allow dynamic import with ssr disabled.
"use client";

import dynamic from "next/dynamic";

import type { GearAlternativeRow } from "~/server/gear/service";
import type { RawSample } from "~/types/gear";

const GearItemDockClient = dynamic(
  () => import("./gear-item-dock.client").then((mod) => mod.GearItemDockClient),
  { ssr: false },
);

export interface GearItemDockProps {
  slug: string;
  gearId?: string;
  gearType: string;
  currentThumbnailUrl?: string | null;
  currentTopViewUrl?: string | null;
  alternatives?: GearAlternativeRow[];
  rawSamples?: RawSample[];
  hasCreatorVideos?: boolean;
}

export function GearItemDock({
  slug,
  gearId,
  gearType,
  currentThumbnailUrl = null,
  currentTopViewUrl = null,
  alternatives = [],
  rawSamples = [],
  hasCreatorVideos = false,
}: GearItemDockProps) {
  return (
    <GearItemDockClient
      slug={slug}
      gearId={gearId}
      gearType={gearType}
      currentThumbnailUrl={currentThumbnailUrl}
      currentTopViewUrl={currentTopViewUrl}
      alternatives={alternatives}
      rawSamples={rawSamples}
      hasCreatorVideos={hasCreatorVideos}
    />
  );
}
