import Link from "next/link";
import { getCategoryLabel, type GearCategorySlug } from "~/lib/browse/routing";

type Props = {
  brand?: { name: string; slug: string } | null;
  category?: GearCategorySlug | null;
  mountShort?: string | null;
};

export default function Breadcrumbs({ brand, category, mountShort }: Props) {
  const items: Array<{ label: string; href?: string }> = [];
  items.push({ label: "Browse", href: "/browse" });

  if (brand) {
    items.push({ label: brand.name, href: `/browse/${brand.slug}` });
  }
  if (brand && category) {
    items.push({
      label: getCategoryLabel(category),
      href: `/browse/${brand.slug}/${category}`,
    });
  }
  if (brand && category && mountShort) {
    items.push({
      label: `${mountShort.toUpperCase()} Mount`,
      // final crumb has no link
    });
  }

  const lastIndex = items.length - 1;

  return (
    <nav aria-label="Breadcrumb" className="text-muted-foreground text-sm">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, idx) => (
          <li key={`${it.label}-${idx}`} className="flex items-center gap-1">
            {idx < lastIndex && it.href ? (
              <Link href={it.href} className="hover:underline">
                {it.label}
              </Link>
            ) : (
              <span className="text-foreground">{it.label}</span>
            )}
            {idx < lastIndex ? <span className="mx-1">/</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
