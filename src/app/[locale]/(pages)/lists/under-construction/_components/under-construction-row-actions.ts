export function shouldRevealRowActions(
  pointerType: string,
  isInteractiveTarget: boolean,
) {
  return pointerType === "touch" && !isInteractiveTarget;
}
