export function normalizeTagIconName(value: string | null | undefined) {
  return value
    ?.trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLocaleLowerCase();
}
