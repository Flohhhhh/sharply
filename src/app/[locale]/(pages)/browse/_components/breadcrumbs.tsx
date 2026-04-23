import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { GearCategorySlug } from "~/lib/browse/routing";
import { getMountDisplayName } from "~/lib/mapping/mounts-map";

type Props = {
  locale: string;
  brand?: { name: string; slug: string } | null;
  category?: GearCategorySlug | null;
  mountValue?: string | null;
};

export default async function Breadcrumbs({
  locale,
  brand,
  category,
  mountValue,
}: Props) {
  const t = await getTranslations({ locale, namespace: "browsePage" });
  const items: Array<{ label: string; href?: string }> = [];
  items.push({ label: t("browse"), href: "/browse" });

  if (brand) {
    items.push({ label: brand.name, href: `/browse/${brand.slug}` });
  }
  if (brand && category) {
    items.push({
      label: t(category),
      href: `/browse/${brand.slug}/${category}`,
    });
  }
  if (brand && category && mountValue) {
    items.push({
      label: t("mountLabel", { mount: getMountDisplayName(mountValue) }),
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
