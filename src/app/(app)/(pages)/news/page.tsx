import { getNewsPosts } from "@/lib/directus";
import { Separator } from "~/components/ui/separator";
import NewsListItem from "./_components/news-list-item";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "News",
  openGraph: {
    title: "News",
  },
};

export default async function NewsPage() {
  const posts = await getNewsPosts();
  const published = posts
    .filter((p) => p.status === "published")
    .sort((a, b) => {
      const da = new Date(
        (a as any).date_created as unknown as string,
      ).getTime();
      const db = new Date(
        (b as any).date_created as unknown as string,
      ).getTime();
      return db - da;
    });
  return (
    <div className="mx-auto min-h-screen max-w-5xl p-6 pt-24">
      <h1 className="mb-6 text-4xl font-semibold tracking-tight">
        News & Updates
      </h1>
      <Separator className="mb-2" />
      <div>
        {published.map((post, idx) => {
          return (
            <div key={post.id}>
              <NewsListItem post={post} />
              {idx < published.length - 1 && <Separator />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
