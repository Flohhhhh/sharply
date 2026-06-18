import type { GearPublicationState } from "~/types/gear";

export const GEAR_PUBLICATION_STATES = {
  PUBLISHED: "PUBLISHED",
  RUMORED: "RUMORED",
  HIDDEN: "HIDDEN",
} as const satisfies Record<string, GearPublicationState>;

export function isRumoredGear(params: {
  publicationState?: GearPublicationState | null;
}): boolean {
  return params.publicationState === GEAR_PUBLICATION_STATES.RUMORED;
}

export function isHiddenGear(params: {
  publicationState?: GearPublicationState | null;
}): boolean {
  return params.publicationState === GEAR_PUBLICATION_STATES.HIDDEN;
}

export function isPublishedGear(params: {
  publicationState?: GearPublicationState | null;
}): boolean {
  return params.publicationState === GEAR_PUBLICATION_STATES.PUBLISHED;
}
