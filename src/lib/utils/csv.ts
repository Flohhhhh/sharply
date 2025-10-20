export function parseSingleColumnCsv(input: string): string[] {
  if (!input) return [];
  const normalized = input.replace(/\r\n?/g, "\n");
  const hasNewlines = normalized.includes("\n");

  const rawItems = hasNewlines
    ? normalized.split("\n").flatMap((line) => {
        const trimmed = line.trim();
        if (!trimmed) return [] as string[];
        const parts = trimmed
          .split(",")
          .map((p) => p.trim())
          .filter((p): p is string => Boolean(p));
        return parts;
      })
    : normalized
        .split(",")
        .map((p) => p.trim())
        .filter((p): p is string => Boolean(p));

  const seen = new Set<string>();
  const names: string[] = [];
  for (const item of rawItems) {
    const lower = item.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    names.push(item);
  }
  return names;
}
