import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { TagIcon } from "~/components/gear/tag-icon";
import { buildTagPageMetadata } from "~/lib/tags/tag-page-metadata";
import {
  fetchPublicTagBySlug,
  fetchPublicTagPage,
} from "~/server/tags/service";
import { TagGearTable } from "./tag-gear-table";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const [tag, t] = await Promise.all([
    fetchPublicTagBySlug(slug),
    getTranslations({ locale, namespace: "tags" }),
  ]);

  if (!tag) {
    return { robots: { index: false, follow: false } };
  }

  return buildTagPageMetadata(
    slug,
    tag,
    t("tagPageDescription", { tag: tag.name }),
    locale,
  );
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [tag, t] = await Promise.all([
    fetchPublicTagPage(slug),
    getTranslations("tags"),
  ]);
  if (!tag) notFound();
  return (
    <main className="mx-auto mt-16 min-h-screen max-w-6xl px-4 py-10">
      <Link href="/tags" className="text-primary text-sm hover:underline">
        {t("backToDictionary")}
      </Link>
      <h1 className="mt-5 flex items-center gap-3 text-4xl font-bold">
        <TagIcon name={tag.icon} size={32} />
        {tag.resolvedPageTitle}
      </h1>
      {!tag.pageContent && tag.description ? (
        <p className="text-muted-foreground mt-2 text-lg">{tag.description}</p>
      ) : null}
      {tag.pageContent ? (
        <div className="mt-8 leading-7 whitespace-pre-wrap">
          {tag.pageContent}
        </div>
      ) : null}
      <section className="mt-12">
        {tag.gear.length ? (
          <TagGearTable gear={tag.gear} />
        ) : (
          <p className="text-muted-foreground mt-3">{t("noMatchingGear")}</p>
        )}
      </section>
    </main>
  );
}
