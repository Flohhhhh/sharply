import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "~/components/rich-text";
import {
  getLearnPageBySlug,
  getAllPublishedLearnPages,
} from "~/server/payload/service";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateStaticParams() {
  const pages = await getAllPublishedLearnPages();
  return pages
    .filter((p) => p.slug)
    .map((p) => ({
      slug: p.slug!,
    }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLearnPageBySlug(slug);
  if (!page) {
    return {};
  }
  const imageSrc =
    page.thumbnail && typeof page.thumbnail === "object"
      ? ((page.thumbnail as any).url ?? undefined)
      : undefined;
  return {
    title: page.title,
    description: page.excerpt ?? "",
    openGraph: {
      title: page.title,
      description: page.excerpt ?? "",
      images: [imageSrc ?? ""],
    },
  };
}

export default async function LearnArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getLearnPageBySlug(slug);
  if (!page) {
    notFound();
  }

  const thumb =
    typeof page.thumbnail === "object" && page.thumbnail
      ? page.thumbnail
      : null;
  const thumbUrl =
    thumb && typeof (thumb as any).url === "string" ? (thumb as any).url : null;
  const thumbAlt =
    thumb && typeof (thumb as any).alt === "string"
      ? ((thumb as any).alt as string)
      : page.title;

  return (
    <>
      <h1 className="mt-2 text-4xl font-bold">{page.title}</h1>
      {thumbUrl ? (
        <Image
          src={thumbUrl}
          alt={thumbAlt}
          className="aspect-[5/2] w-full rounded-lg object-cover"
          width={1280}
          height={720}
          priority
        />
      ) : null}
      {(page.thumbnail_credit || page.thumbnail_credit_link) && (
        <div className="not-prose text-muted-foreground -mt-4 text-sm">
          {page.thumbnail_credit ? (
            <>
              Photo by{" "}
              {page.thumbnail_credit_link ? (
                <Link
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  href={page.thumbnail_credit_link}
                >
                  {page.thumbnail_credit}
                </Link>
              ) : (
                <span className="underline">{page.thumbnail_credit}</span>
              )}
            </>
          ) : null}
        </div>
      )}
      <RichText data={page.content as any} className="mt-6" />
    </>
  );
}
