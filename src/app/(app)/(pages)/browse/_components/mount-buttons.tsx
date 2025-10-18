import Link from "next/link";
import { getMountsForBrand } from "~/server/gear/browse/data";

export default async function MountButtons({
  brandId,
  brandSlug,
  category,
}: {
  brandId: string;
  brandSlug: string;
  category: "cameras" | "lenses";
}) {
  const mounts = await getMountsForBrand(brandId);
  if (!mounts || mounts.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
  );
}
