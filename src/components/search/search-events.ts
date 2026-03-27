export const SEARCH_OPEN_EVENT = "sharply:open-command-palette";

export function dispatchOpenSearchSurface() {
  try {
    document.dispatchEvent(new CustomEvent(SEARCH_OPEN_EVENT));
  } catch {
    // Ignore environments without DOM support.
  }
}
