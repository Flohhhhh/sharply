// This wrapper is client-only to allow dynamic import with ssr disabled.
"use client";

import dynamic from "next/dynamic";

import type {
  GearAlternativeRow,
  GearLineageRelationships,
} from "~/server/gear/service";
import type {
  GearColorway,
  GearPublicationState,
  GearType,
  RawSample,
} from "~/types/gear";

const EMPTY_ALTERNATIVES: GearAlternativeRow[] = [];
const EMPTY_LINEAGE: GearLineageRelationships = {
  predecessor: null,
  successor: null,
};
const EMPTY_SAMPLES: RawSample[] = [];
const EMPTY_COLORWAYS: GearColorway[] = [];

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
  publicationState?: GearPublicationState | null;
  alternatives?: GearAlternativeRow[];
  lineage?: GearLineageRelationships;
  rawSamples?: RawSample[];
  hasCreatorVideos?: boolean;
  colorways?: GearColorway[];
}

export function GearItemDock({
  slug,
  gearId,
  gearType,
  currentThumbnailUrl = null,
  currentTopViewUrl = null,
  currentRearViewUrl = null,
  currentInstructionManualUrl = null,
  publicationState = null,
  alternatives = EMPTY_ALTERNATIVES,
  lineage = EMPTY_LINEAGE,
  rawSamples = EMPTY_SAMPLES,
  hasCreatorVideos = false,
  colorways = EMPTY_COLORWAYS,
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
      publicationState={publicationState}
      alternatives={alternatives}
      lineage={lineage}
      rawSamples={rawSamples}
      hasCreatorVideos={hasCreatorVideos}
      colorways={colorways}
    />
  );
}
