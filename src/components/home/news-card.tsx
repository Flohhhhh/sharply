import Image from "next/image";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";

export type HomePost = {
  id: number | string;
  title: string;
  excerpt?: string;
  href: string;
  image: string;
  date?: string;
  readMinutes?: number;
};

export type NewsCardSize = "lg" | "md" | "sm";

export function NewsCard({
  post,
  badge,
  size = "md",
  imagePriority = false,
}: {
  post: HomePost;
  badge?: string;
  size?: NewsCardSize;
  imagePriority?: boolean;
}) {
  const titleClass =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";
  const excerptClass = size === "sm" ? "text-xs" : "text-sm";
  const imageAspect = size === "sm" ? "aspect-[16/10]" : "aspect-[16/9]";
  const containerPadding = size === "sm" ? "p-2" : "p-3";
  const gapClass = size === "sm" ? "my-3" : "my-5";
  return (
    <Link
      href={post.href}
      className="group bg-background flex flex-col overflow-hidden rounded-xl border shadow-sm"
    >
      <div className={`shrink-0 ${containerPadding}`}>
        <div className={`relative ${imageAspect} w-full`}>
          <Image
            src={post.image}
            alt={post.title}
            priority={imagePriority}
            width={512}
            height={320}
            className="h-full w-full rounded-lg object-cover"
          />
          {badge ? (
            <div className="absolute top-3 left-3">
              <Badge>{badge}</Badge>
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col px-3 pt-2 pb-4">
        <h2 className={`mb-1 font-bold group-hover:underline ${titleClass}`}>
          {post.title}
        </h2>
        {post.excerpt ? (
          <p
            className={`text-muted-foreground line-clamp-2 group-hover:underline ${excerptClass}`}
          >
            {post.excerpt}
          </p>
        ) : null}
        <div className="mt-auto">
          <Separator className={gapClass} />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground text-sm group-hover:underline">
              {post.date ?? ""}
            </span>
            {typeof post.readMinutes === "number" ? (
              <Badge
                variant="secondary"
                className="h-fit group-hover:underline"
              >
                {post.readMinutes} Min Read
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
