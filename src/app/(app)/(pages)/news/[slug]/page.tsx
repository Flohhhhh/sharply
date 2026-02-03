import { getNewsPosts } from "~/server/payload/service";
import { notFound } from "next/navigation";
import { getNewsPostBySlug } from "~/server/payload/service";
import Image from "next/image";
import { Badge } from "~/components/ui/badge";
import { Calendar, ExternalLink } from "lucide-react";
import { formatHumanDate } from "~/lib/utils";
import type { Metadata } from "next";
import { RichText } from "~/components/rich-text";
import { TableOfContents } from "~/components/rich-text/table-of-contents";
import { GearCardHorizontal } from "~/components/gear/gear-card-horizontal";
import { fetchGearBySlug } from "~/server/gear/service";
import { getBrandNameById } from "~/lib/mapping/brand-map";
import DiscordBanner from "~/components/discord-banner";
import { ScrollProgress } from "~/components/ui/skiper-ui/scroll-progress";
import Link from "next/link";
import { Separator } from "~/components/ui/separator";

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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.sharplyphoto.com";
  const imageSrc =
    page.thumbnail && typeof page.thumbnail === "object"
      ? (page.thumbnail.url ?? undefined)
      : undefined;
  const ogImage = imageSrc
    ? {
        url: imageSrc,
        width: 1200,
        height: 630,
        alt: page.title,
      }
    : {
        url: `${baseUrl}/og-default.png`,
        width: 1200,
        height: 630,
        alt: "Sharply - Photography News",
      };
  return {
    title: `${page.title}`,
    description: page.excerpt ?? "",
    openGraph: {
      type: "article",
      title: `${page.title}`,
      description: page.excerpt ?? "",
      url: `${baseUrl}/news/${slug}`,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.title}`,
      description: page.excerpt ?? "",
      images: [ogImage.url],
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

  // Fetch related gear (array of slugs stored in JSON field)
  const relatedGearItems = Array.isArray(page.related_gear_items)
    ? (
        await Promise.all(
          (page.related_gear_items as unknown[])
            .filter((v): v is string => typeof v === "string")
            .map(async (gearSlug) => {
              try {
                return await fetchGearBySlug(gearSlug);
              } catch {
                return null;
              }
            }),
        )
      ).filter(Boolean)
    : [];
  const sourceLinks =
    Array.isArray(page.sourceLinks) && page.sourceLinks.length > 0
      ? page.sourceLinks
          .map((source) => {
            const name =
              source && typeof source === "object" && "name" in source
                ? source.name
                : null;
            const link =
              source && typeof source === "object" && "link" in source
                ? source.link
                : null;
            return {
              id:
                source && typeof source === "object" && "id" in source
                  ? source.id
                  : null,
              name: typeof name === "string" ? name : null,
              link: typeof link === "string" ? link : null,
            };
          })
          .filter(
            (
              source,
            ): source is { id: string | null; name: string; link: string } =>
              Boolean(source.name) && Boolean(source.link),
          )
      : [];

  return (
    <div className="mx-auto my-24 flex min-h-screen flex-col items-center gap-12 px-4 sm:px-8">
      <ScrollProgress bottomOffset={300} />
      <div className="flex flex-col items-center gap-4">
        <Badge className="bg-accent text-accent-foreground">{category}</Badge>
        <h1 className="max-w-3xl text-center text-3xl font-semibold sm:max-w-5xl sm:text-6xl">
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
          className="aspect-video w-full max-w-5xl rounded-lg object-cover"
        />
      )}
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 lg:grid-cols-7">
        <div id="news-content" className="col-span-5 mx-auto w-full max-w-3xl">
          <RichText
            data={page.content}
            demoteHeadingsBy={1}
            className="w-full max-w-none"
          />

          {relatedGearItems.length > 0 ? (
            <div className="mt-6">
              <h2 className="mb-3 py-8 text-2xl font-semibold opacity-90 sm:text-4xl">
                Gear in This Article
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {relatedGearItems.map((item: any) => (
                  <GearCardHorizontal
                    key={item.id}
                    slug={item.slug}
                    name={item.name}
                    thumbnailUrl={item.thumbnailUrl}
                    brandName={getBrandNameById(item.brandId ?? "") ?? ""}
                    gearType={item.gearType}
                    href={`/gear/${item.slug}`}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="sticky top-24 col-span-2 hidden h-fit space-y-8 self-start lg:block">
          <TableOfContents contentSelector="#news-content" />
          <Separator />
          {sourceLinks.length > 0 ? (
            <div className="space-y-3">
              <div className="text-muted-foreground text-sm font-semibold">
                Links
              </div>
              <div className="flex flex-col gap-2 text-sm">
                {sourceLinks.map((source) => ( 
                  <Link
                    key={source.id ?? source.link}
                    href={source.link}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-primary flex items-start gap-2 rounded border px-3 py-2 hover:underline"
                  >
                    <ExternalLink className="text-muted-foreground mt-0.5 h-4 w-4" />
                    <span>{source.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
      <DiscordBanner label="Join the Discussion" className="w-full max-w-5xl" />
    </div>
  );
}
