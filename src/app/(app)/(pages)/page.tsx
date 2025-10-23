import Link from "next/link";
import { GlobalSearchBar } from "~/components/search/global-search-bar";
import { GearCounter } from "~/components/home/gear-counter";
import { ContributionCounter } from "~/components/home/contribution-counter";
import { Button } from "~/components/ui/button";
import { ArrowRightIcon, BookOpenIcon, Loader } from "lucide-react";
import { Separator } from "~/components/ui/separator";
import { Suspense } from "react";
import { NewsCard as HomeNewsCard } from "~/components/home/news-card";
import { ReviewCard, type ReviewPost } from "~/components/home/review-card";
import TrendingList from "~/components/trending-list";
import { getNewsPosts } from "~/server/payload/service";
import { formatHumanDate } from "~/lib/utils";
import type { News } from "~/payload-types";

export const revalidate = 60;

function stripHtml(html: string | null | undefined, maxLength = 160) {
  if (!html) return "";
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + "…";
}

// const REVIEW_ITEMS: ReviewPost[] = [
//   {
//     id: 1,
//     title: "Nikon Z 24-70mm f/2.8 S: Long-term review",
//     href: "#",
//     author: { name: "Alex Johnson", avatar: "/image-temp.png" },
//     date: "2025-08-22",
//     ratingPercent: 86,
//   },
//   {
//     id: 2,
//     title: "Sony a7 IV: The hybrid king in 2025?",
//     href: "#",
//     author: { name: "Sam Rivera" },
//     date: "2025-08-21",
//     ratingPercent: 91,
//   },
//   {
//     id: 3,
//     title: "Fujifilm X100VI: Street shooter’s dream",
//     href: "#",
//     author: { name: "Jamie Lee" },
//     date: "2025-08-20",
//     ratingPercent: 88,
//   },
// ];

// Using reusable HomeNewsCard component from ~/components/home/news-card

export default async function Home() {
  const posts: News[] = await getNewsPosts();

  const toHomePost = (p: (typeof posts)[number]) => {
    const thumbId =
      p.thumbnail && typeof p.thumbnail === "object"
        ? (p.thumbnail.url ?? undefined)
        : undefined;
    const image = thumbId ? (thumbId ?? undefined) : "/image-temp.png";
    const date = formatHumanDate(p.createdAt);
    return {
      id: p.id,
      title: p.title,
      excerpt: stripHtml(p.excerpt),
      href: `/news/${p.slug}`,
      image,
      date,
    };
  };

  const featuredPost = posts[0] ? toHomePost(posts[0]!) : null;
  const otherPosts = posts.slice(1, 7).map(toHomePost);

  // TODO: Add editorial reviews from Payload once we have some
  const reviewItems = [] as ReviewPost[];

  return (
    <div className="min-h-screen px-4 sm:px-6">
      {/* HERO */}
      <section className="w-full pt-20">
        <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <h1 className="text-3xl font-bold tracking-tight md:text-6xl">
              Real specs, real reviews, real fast.
            </h1>

            {/* Search box */}
            <div className="mx-auto w-full max-w-7xl">
              <div className="relative">
                <Suspense
                  fallback={
                    <div className="relative">
                      <div className="text-muted-foreground flex h-12 items-center rounded-lg border pr-14 pl-9 text-sm">
                        Loading search…
                        <Loader className="ml-auto h-5 w-5 animate-spin" />
                      </div>
                    </div>
                  }
                >
                  <GlobalSearchBar size="lg" />
                </Suspense>
              </div>

              {/* <ScopeChips /> */}
            </div>
            <p className="text-muted-foreground mx-auto mt-2 max-w-2xl text-balance">
              Search for any gear, find specs, and read reviews from both users
              and experts.
            </p>
            {/* 
            <Link
              href="/about/how-we-test"
              className="text-primary mt-4 inline-block text-sm underline-offset-4 hover:underline"
            >
              Learn more
            </Link> */}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto mt-6 w-full max-w-7xl">
        <div className="mx-auto grid max-w-[96rem] grid-cols-1 gap-4 md:grid-cols-5 xl:grid-cols-6">
          {/* Center column featured post */}
          <div className="col-span-full md:col-span-3 xl:col-span-4">
            {featuredPost ? (
              <HomeNewsCard badge="Featured" post={featuredPost} />
            ) : null}

            {/* News feed continuing below the featured article */}
            <div className="mt-4 flex flex-col gap-4">
              {otherPosts.map((item) => (
                <HomeNewsCard key={item.id} post={item} size="md" />
              ))}
            </div>
          </div>
          {/* Right column smaller links/posts */}
          <div className="col-span-full md:col-span-2 xl:col-span-2">
            <div className="flex h-full flex-col gap-4">
              {/* About + actions */}
              <div className="space-y-3 px-4">
                <h2 className="text-3xl font-bold">About Sharply</h2>
                <p className="text-muted-foreground">
                  Sharply is a contributor-driven photography platform for
                  personalized comparisons, powered by the web's most
                  comprehensive crowd-sourced specs.
                </p>
                <div className="flex flex-col items-start gap-4 py-2">
                  <GearCounter />
                  <ContributionCounter />
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <Button asChild>
                    <Link href="/about">View all gear</Link>
                  </Button>
                  <Button
                    variant="link"
                    asChild
                    icon={<ArrowRightIcon className="h-4 w-4" />}
                    iconPosition="right"
                    className="-ml-4"
                  >
                    <Link href="/about">Learn more</Link>
                  </Button>
                </div>
              </div>
              {/* Stats */}
              <div className="flex flex-col gap-2 px-4"></div>
              <Separator className="my-4" />
              {/* Banner link: New to Photography? */}
              <Link
                href="/beginners-guide"
                className="dark:bg-accent/50 flex flex-col gap-2 overflow-hidden rounded-xl border bg-white p-5 transition-colors"
              >
                <h3 className="text-2xl font-semibold">New to Photography?</h3>
                <p className="text-muted-foreground mt-1 mb-8 text-sm">
                  We've put together a beginners guide to everything you need to
                  know to get started! View our step-by-step guide series.
                </p>
                <Button
                  variant="secondary"
                  className="mt-auto hover:cursor-pointer"
                  icon={<BookOpenIcon className="h-4 w-4" />}
                >
                  Get Started
                </Button>
              </Link>
              <Separator className="my-4" />
              {/* Latest Reviews */}
              <div className="space-y-4">
                <Suspense fallback={<TrendingList loading rows={10} />}>
                  <TrendingList timeframe="7d" limit={10} />
                </Suspense>
                <Separator className="my-8" />
                <h2 className="text-2xl font-semibold">Latest Reviews</h2>
                {reviewItems?.map((post) => (
                  <ReviewCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BRANDS STRIP */}
      {/* <BrandsStrip /> */}

      {/* LATEST NEWS */}
      {/* <LatestContent /> */}
    </div>
  );
}
