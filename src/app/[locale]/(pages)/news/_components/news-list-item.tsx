import Image from "next/image";
import Link from "next/link";
import type { News } from "~/payload-types";
import { ArrowRight } from "lucide-react";
import { formatDate } from "~/lib/format/date";

type NewsListItemProps = {
  post: News;
  locale: string;
};

function stripHtml(html: string | null | undefined, maxLength = 160) {
  if (!html) return "";
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + "…";
}

export function NewsListItem({ post, locale }: NewsListItemProps) {
  const href = `/news/${post.slug}`;

  // console.log(post);
  // const imgSrc = post.thumbnail
  //   ? (typeof post.thumbnail === "object" ? post.thumbnail.url ?? undefined : undefined)
  //   : undefined;
  const date = post.override_date || post.createdAt;
  const imageUrl =
    post.thumbnail && typeof post.thumbnail === "object"
      ? (post.thumbnail.url ?? undefined)
      : undefined;
  const formattedDate = formatDate(date, {
    locale,
    preset: "date-long",
  });

  return (
    <Link href={href} className="group">
      <div className="grid grid-cols-[280px_1fr_40px] items-stretch gap-6 py-6">
        <div className="bg-muted relative hidden overflow-hidden rounded-md sm:block">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={post.title}
              width={560}
              height={320}
              className="aspect-[16/9] h-full w-full object-cover"
            />
          ) : (
            <div className="aspect-[16/9]" />
          )}
        </div>

        <div className="flex h-full flex-col">
          <span className="text-muted-foreground mb-4 text-xs sm:mt-0">
            {formattedDate}
          </span>
          <div className="mt-auto flex flex-col gap-2">
            <h3 className="line-clamp-2 text-lg leading-snug font-semibold tracking-tight group-hover:underline sm:text-2xl">
              {post.title}
            </h3>
            <p className="text-muted-foreground line-clamp-2 text-xs sm:text-sm">
              {stripHtml(post.excerpt)}
            </p>
          </div>
        </div>

        <div className="flex h-full items-center justify-end">
          <div className="group-hover:bg-accent group-hover:text-accent-foreground rounded-full border p-2 transition-colors">
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default NewsListItem;
