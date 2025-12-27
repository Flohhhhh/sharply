import Link from "next/link";
import AllGearContent from "./all-gear-content";

export default function BrandContent({ brandSlug }: { brandSlug: string }) {
  const items = [
    { label: "Cameras", href: `/browse/${brandSlug}/cameras` },
    { label: "Lenses", href: `/browse/${brandSlug}/lenses` },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className="border-border hover:bg-accent/40 group block rounded-lg border p-2 text-center sm:p-6"
          >
            <div className="text-lg font-semibold group-hover:underline sm:text-2xl">
              {i.label}
            </div>
            <div className="text-muted-foreground mt-1 text-sm">
              Browse {i.label}
            </div>
          </Link>
        ))}
      </div>
      {/* Brand-specific latest and trending */}
      <AllGearContent brandSlug={brandSlug} showBrandPicker={false} />
    </div>
  );
}
