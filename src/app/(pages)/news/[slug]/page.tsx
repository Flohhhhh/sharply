import { getNewsPosts } from "@/lib/directus";
import { notFound } from "next/navigation";
import { getNewsPostBySlug } from "@/lib/directus";
import Image from "next/image";
import { Badge } from "~/components/ui/badge";
import { Calendar } from "lucide-react";
import { formatHumanDate } from "~/lib/utils";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await getNewsPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getNewsPostBySlug(slug);
  return {
    title: `${page.title}`,
  };
}

export default async function DynamicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getNewsPostBySlug(slug);
  if (!page) return notFound();

  const category = page.post_type === "news" ? "News" : "Article";
  // Add a timestamp to the image src to ensure it's revalidated when page is rebuilt
  const imageSrc = `https://sharply-directus.onrender.com/assets/${page.thumbnail}?v=${Date.now()}`;
  // console.log(page);

  return (
    <div className="mx-auto mt-24 flex min-h-screen max-w-5xl flex-col items-center gap-12 p-6">
      <div className="flex flex-col items-center gap-4">
        <Badge className="bg-accent text-accent-foreground">{category}</Badge>
        <h1 className="text-center text-6xl font-semibold">{page.title}</h1>
        <div className="text-muted-foreground -mt-1 flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4" />
          <span className="pt-1">
            {formatHumanDate(new Date(page.date_created))}
          </span>
        </div>
      </div>

      {page.thumbnail && (
        <Image
          src={imageSrc}
          alt={page.title}
          width={1280}
          height={720}
          className="aspect-video w-full rounded-lg object-cover"
        />
      )}
      <article className="prose mx-auto w-full max-w-3xl">
        <div
          dangerouslySetInnerHTML={{ __html: page.news_content_wysiwyg }}
        ></div>
      </article>
    </div>
  );
}
