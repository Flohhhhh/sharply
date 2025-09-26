import { getNewsPosts } from "@/lib/directus";
import { Separator } from "~/components/ui/separator";
import NewsListItem from "./_components/news-list-item";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "News",
};

export default async function NewsPage() {
  const posts = await getNewsPosts();
  return (
    <div className="mx-auto min-h-screen max-w-5xl p-6 pt-24">
      <h1 className="mb-6 text-4xl font-semibold tracking-tight">
        News & Updates
      </h1>
      <Separator className="mb-2" />
      <div>
        {posts.map((post, idx) => {
          if (post.status !== "published") return null;
          return (
            <div key={post.id}>
              <NewsListItem post={post} />
              {idx < posts.length - 1 && <Separator />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
