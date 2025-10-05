/**
 * Card Slots formatting helpers
 * Shared between input components and display pages.
 */

/** Title-case/normalize enum token to a readable label. */
export function titleizeCardEnum(value: string): string {
  const words = value.replace(/_/g, " ").split(" ");
  return words
    .map((w) => {
      const lower = w.toLowerCase();
      if (lower.startsWith("cfexpress"))
        return w.toUpperCase().replace("TYPE", "Type");
      if (lower === "uhs") return "UHS";
      if (lower === "sd") return "SD";
      if (lower === "xqd") return "XQD";
      if (lower === "cfast") return "CFast";
      if (lower === "vpg") return "VPG";
      // Uppercase standalone roman numerals (e.g., "ii" -> "II")
      if (/^(i|ii|iii|iv|v|vi|vii|viii|ix|x)$/i.test(w)) return w.toUpperCase();
      if (/^gen\d+x\d+$/i.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

export type MinimalCardSlot = {
  slotIndex?: number | null;
  supportedFormFactors?: string[] | null;
  supportedBuses?: string[] | null;
  supportedSpeedClasses?: string[] | null;
};

/**
 * Build a single-line human-readable details string for a slot.
 * Example: "SD | UHS-II | V90"
 */
export function formatCardSlotDetails(slot: MinimalCardSlot): string {
  const ff = Array.isArray(slot.supportedFormFactors)
    ? slot.supportedFormFactors.map((v) => titleizeCardEnum(v)).join(", ")
    : "";
  const buses = Array.isArray(slot.supportedBuses)
    ? slot.supportedBuses.map((v) => titleizeCardEnum(v)).join(", ")
    : "";
  const speeds = Array.isArray(slot.supportedSpeedClasses)
    ? slot.supportedSpeedClasses
        .map((v) => v.toUpperCase().replace("_", "-"))
        .join(", ")
    : "";
  return [ff, buses, speeds].filter(Boolean).join(" | ");
}

/**
 * Summarize an array of slots to one-line strings, optionally prefixed with slot number.
 */
export function summarizeCardSlots(
  slots: MinimalCardSlot[] | undefined | null,
  withPrefix = true,
): string[] {
  if (!Array.isArray(slots) || slots.length === 0) return ["None"];
  return slots.slice(0, 2).map((s, idx) => {
    const details = formatCardSlotDetails(s);
    return withPrefix
      ? `S${s.slotIndex ?? idx + 1}: ${details || "(empty)"}`
      : details || "(empty)";
  });
}
