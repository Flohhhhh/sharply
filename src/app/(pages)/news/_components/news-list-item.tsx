import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { NewsPost } from "@/lib/directus";

type NewsListItemProps = {
  post: NewsPost;
};

function formatDotDate(input: string | Date) {
  const d = new Date(input);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}.${month}.${year}`;
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
              alt={post.Title}
              width={560}
              height={320}
              className="aspect-[16/9] h-full w-full object-cover"
            />
          ) : (
            <div className="aspect-[16/9]" />
          )}
        </div>

        <div className="flex h-full flex-col">
          <span className="text-muted-foreground text-xs">
            {formatDotDate(post.date_created as unknown as string)}
          </span>
          <div className="mt-auto flex flex-col gap-2">
            <h3 className="text-lg leading-snug font-semibold tracking-tight group-hover:underline sm:text-2xl">
              {post.Title}
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
