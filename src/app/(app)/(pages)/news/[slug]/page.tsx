import { getNewsPosts } from "~/server/payload/service";
import { notFound } from "next/navigation";
import { getNewsPostBySlug } from "~/server/payload/service";
import Image from "next/image";
import { Badge } from "~/components/ui/badge";
import { Calendar } from "lucide-react";
import { formatHumanDate } from "~/lib/utils";
import type { Metadata } from "next";
import type { News } from "~/payload-types";
import { RichText } from "~/components/rich-text";
import { TableOfContents } from "~/components/rich-text/table-of-contents";

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
    openGraph: {
      title: `${page.title}`,
    },
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

  const category = "News";
  // Add a timestamp to the image src to ensure it's revalidated when page is rebuilt
  const imageSrc =
    page.thumbnail && typeof page.thumbnail === "object"
      ? (page.thumbnail.url ?? undefined)
      : undefined;
  // console.log(page);

  return (
    <div className="mx-auto my-24 flex min-h-screen max-w-5xl flex-col items-center gap-12 p-6">
      <div className="flex flex-col items-center gap-4">
        <Badge className="bg-accent text-accent-foreground">{category}</Badge>
        <h1 className="text-center text-5xl font-semibold sm:text-6xl">
          {page.title}
        </h1>
        <div className="text-muted-foreground -mt-1 flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4" />
          <span className="pt-1">
            {formatHumanDate(new Date(page.override_date || page.createdAt))}
          </span>
        </div>
      </div>

      {page.thumbnail && (
        <Image
          src={imageSrc ?? ""}
          alt={page.title}
          width={1280}
          height={720}
          className="aspect-video w-full rounded-lg object-cover"
        />
      )}
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 lg:grid-cols-7">
        <RichText
          data={page.content}
          demoteHeadingsBy={1}
          className="col-span-5 mx-auto w-full max-w-3xl"
        />

        <aside className="sticky top-24 col-span-2 hidden h-fit self-start lg:block">
          <TableOfContents />
        </aside>
      </div>
    </div>
  );
}
