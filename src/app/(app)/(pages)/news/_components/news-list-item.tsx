import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { NewsPost } from "@/lib/directus";

type NewsListItemProps = {
  post: NewsPost;
};

function getOrdinalSuffix(day: number) {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function formatDotDate(input: string | Date) {
  const d = new Date(input);
  const dayNumber = d.getUTCDate();
  const monthName = d.toLocaleString("en-US", {
    month: "long",
    timeZone: "UTC",
  });
  const year = d.getUTCFullYear();
  const suffix = getOrdinalSuffix(dayNumber);
  return `${monthName} ${dayNumber}${suffix}, ${year}`;
}

function stripHtml(html: string | null | undefined, maxLength = 160) {
  if (!html) return "";
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + "…";
}

export function NewsListItem({ post }: NewsListItemProps) {
  const href = `/news/${post.slug}`;
  const imgSrc = post.thumbnail
    ? `https://sharply-directus.onrender.com/assets/${post.thumbnail}`
    : undefined;

  return (
    <Link href={href} className="group">
      <div className="grid grid-cols-[280px_1fr_40px] items-stretch gap-6 py-6">
        <div className="bg-muted relative hidden overflow-hidden rounded-md sm:block">
          {imgSrc ? (
            <Image
              src={imgSrc}
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
            {formatDotDate(post.date_created as unknown as string)}
          </span>
          <div className="mt-auto flex flex-col gap-2">
            <h3 className="line-clamp-2 text-lg leading-snug font-semibold tracking-tight group-hover:underline sm:text-2xl">
              {post.title}
            </h3>
            <p className="text-muted-foreground line-clamp-2 text-xs sm:text-sm">
              {stripHtml(post.news_content_wysiwyg)}
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
