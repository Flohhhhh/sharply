import { getNewsPosts } from "@/lib/directus";
import { notFound } from "next/navigation";
import { getNewsPostBySlug } from "@/lib/directus";
import Image from "next/image";

export async function generateStaticParams() {
  const posts = await getNewsPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function DynamicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getNewsPostBySlug(slug);
  if (!page) return notFound();

  console.log(page);

  return (
    <div className="mx-auto min-h-screen max-w-4xl p-6 pt-20">
      <h1 className="text-4xl font-semibold">{page.Title}</h1>
      <article className="prose prose-sm pt-6">
        {page.thumbnail && (
          <Image
            src={`https://sharply-directus.onrender.com/assets/${page.thumbnail}`}
            alt={page.Title}
            width={1280}
            height={720}
            className="rounded-lg"
          />
        )}
        <div
          dangerouslySetInnerHTML={{ __html: page.news_content_wysiwyg }}
        ></div>
      </article>
    </div>
  );
}
