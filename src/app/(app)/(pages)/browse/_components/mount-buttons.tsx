import Link from "next/link";
import { getMountsForBrand } from "~/server/gear/browse/data";
import { mountUIConfig } from "~/lib/browse/mount-ui";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Button } from "~/components/ui/button";

export default async function MountButtons({
  brandId,
  brandSlug,
  category,
}: {
  brandId: string;
  brandSlug: string;
  category: "cameras" | "lenses";
}) {
  let mounts = await getMountsForBrand(brandId);
  let hiddenMounts: typeof mounts = [];
  const rules = mountUIConfig[brandSlug]?.[category];
  // Auto-hide mounts without a shortName
  if (mounts.length) {
    const autoHidden = mounts.filter((m) => !m.shortName);
    if (autoHidden.length) hiddenMounts = [...hiddenMounts, ...autoHidden];
    mounts = mounts.filter((m) => !!m.shortName);
  }
  if (rules?.hide?.length) {
    const hidden = new Set(rules.hide.map((s) => s.toLowerCase()));
    hiddenMounts = [
      ...hiddenMounts,
      ...mounts.filter((m) => hidden.has((m.shortName ?? "").toLowerCase())),
    ];
    mounts = mounts.filter(
      (m) => !hidden.has((m.shortName ?? "").toLowerCase()),
    );
  }
  if (rules?.order?.length) {
    const rank = new Map(rules.order.map((s, i) => [s.toLowerCase(), i]));
    mounts = mounts
      .map((m) => ({
        ...m,
        _r: rank.has((m.shortName ?? "").toLowerCase())
          ? rank.get((m.shortName ?? "").toLowerCase())!
          : Number.MAX_SAFE_INTEGER,
      }))
      .sort((a, b) => a._r - b._r || a.value.localeCompare(b.value))
      .map(({ _r, ...rest }) => rest);
  }
  const visibleCount = mounts?.length ?? 0;
  const gridCols = (() => {
    if (visibleCount === 2) return "grid-cols-2";
    if (visibleCount === 3) return "grid-cols-3";
    if (visibleCount >= 4) return "grid-cols-2"; // two rows of two
    return ""; // 0 or 1 -> no grid
  })();

  if (visibleCount === 0 && hiddenMounts.length === 0) return null;

  return (
    <div className="space-y-3">
      {visibleCount >= 2 ? (
        <div className={`grid gap-4 ${gridCols}`}>
          {mounts.map((m) => (
            <Link
              key={m.id}
              href={`/browse/${brandSlug}/${category}/${m.shortName ?? m.value}`}
              className="border-border hover:bg-accent/40 group block rounded-lg border p-6 text-center"
            >
              <div className="text-2xl font-semibold group-hover:underline">
                {(m.shortName ?? m.value).toUpperCase()} Mount
              </div>
              <div className="text-muted-foreground mt-1 text-sm">
                Browse {category}
              </div>
            </Link>
          ))}
        </div>
      ) : null}
      {hiddenMounts.length > 0 ? (
        <div className="flex justify-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="link" className="text-muted-foreground">
                Other mounts
              </Button>
            </PopoverTrigger>
            <PopoverContent align="center" className="w-64">
              <div className="grid grid-cols-1 gap-2">
                {hiddenMounts.map((m) => (
                  <Link
                    key={m.id}
                    href={`/browse/${brandSlug}/${category}/${m.shortName ?? m.value}`}
                    className="hover:bg-accent/40 rounded-md px-3 py-2 text-center"
                  >
                    {(m.shortName ?? m.value).toUpperCase()} Mount
                  </Link>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      ) : null}
    </div>
  );
}
