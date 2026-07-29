import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TagIcon } from "~/components/gear/tag-icon";
import { fetchPublicTagDictionary } from "~/server/tags/service";

export const revalidate = 60;

export default async function TagsPage() {
  const [tags, t] = await Promise.all([
    fetchPublicTagDictionary(),
    getTranslations("tags"),
  ]);
  return (
    <main className="mx-auto mt-16 min-h-screen max-w-5xl px-4 py-10">
      <h1 className="text-4xl font-bold">{t("dictionaryTitle")}</h1>
      <p className="text-muted-foreground mt-2">{t("dictionaryDescription")}</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {tags.map((tag) => (
          <TagDictionaryCard key={tag.id} tag={tag} />
        ))}
      </div>
    </main>
  );
}

function TagDictionaryCard({
  tag,
}: {
  tag: Awaited<ReturnType<typeof fetchPublicTagDictionary>>[number];
}) {
  const cardContent = tag.pageContent || tag.description;

  return (
    <Link
      href={`/tags/${tag.slug}`}
      className="hover:bg-muted rounded-md border p-4"
    >
      <h2 className="flex items-center gap-2 font-semibold">
        <TagIcon name={tag.icon} size={18} />
        {tag.name}
      </h2>
      {cardContent ? (
        <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
          {cardContent}
        </p>
      ) : null}
    </Link>
  );
}
