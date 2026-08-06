import { getTranslations } from "next-intl/server";
import { fetchPublicTagDictionary } from "~/server/tags/service";
import { TagDictionary } from "./tag-dictionary";

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
      <TagDictionary
        noMatchingTagsLabel={t("noMatchingTags")}
        searchTagsLabel={t("searchTags")}
        tags={tags}
      />
    </main>
  );
}
