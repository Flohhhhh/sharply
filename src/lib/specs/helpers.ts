import type { GearItem } from "~/types/gear";

export function supportsVideoMeaningfully(item: GearItem): boolean {
  return (
    item.cameraSpecs?.cameraType === "mirrorless" ||
    item.cameraSpecs?.cameraType === "action" ||
    item.cameraSpecs?.cameraType === "cinema"
  );
}
