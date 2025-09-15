export function formatFilterType(filterType: string): string {
  // custom cases
  if (filterType === "front-screw-on") return "Front Screw-on";
  if (filterType === "rear-screw-on") return "Rear Screw-on";
  if (filterType === "rear-drop-in") return "Rear Drop-in";

  // for all others capitalize each word and remove hyphens
  return filterType
    .split("-")
    .map((part) =>
      part
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
    )
    .join(" ");
}
