import { getNewsPosts } from "@/lib/directus";
import type { Post } from "@/types/directus";
import Link from "next/link";

export default async function NewsPage() {
  const posts = await getNewsPosts();
  return (
    <div className="mx-auto min-h-screen max-w-4xl p-6 pt-20">
      {posts.map((post) => (
        <Link href={`/news/${post.slug}`} key={post.id}>
          <div>{post.Title}</div>
        </Link>
      ))}
    </div>
  );
}
