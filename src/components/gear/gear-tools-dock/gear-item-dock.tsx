// This wrapper is client-only to allow dynamic import with ssr disabled.
"use client";

import dynamic from "next/dynamic";

import type { GearAlternativeRow } from "~/server/gear/service";
import type { GearType,RawSample } from "~/types/gear";

const GearItemDockClient = dynamic(
  () => import("./gear-item-dock.client").then((mod) => mod.GearItemDockClient),
  { ssr: false },
);

export interface GearItemDockProps {
  slug: string;
  gearId?: string;
  gearType: GearType;
  currentThumbnailUrl?: string | null;
  currentTopViewUrl?: string | null;
  currentRearViewUrl?: string | null;
  currentInstructionManualUrl?: string | null;
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
  currentRearViewUrl = null,
  currentInstructionManualUrl = null,
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
      currentRearViewUrl={currentRearViewUrl}
      currentInstructionManualUrl={currentInstructionManualUrl}
      alternatives={alternatives}
      rawSamples={rawSamples}
      hasCreatorVideos={hasCreatorVideos}
    />
  );
}
