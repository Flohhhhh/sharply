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
import { getNewsPosts } from "@/lib/directus";
import { formatHumanDate } from "~/lib/utils";

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

const REVIEW_ITEMS: ReviewPost[] = [
  {
    id: 1,
    title: "Nikon Z 24-70mm f/2.8 S: Long-term review",
    href: "#",
    author: { name: "Alex Johnson", avatar: "/image-temp.png" },
    date: "2025-08-22",
    ratingPercent: 86,
  },
  {
    id: 2,
    title: "Sony a7 IV: The hybrid king in 2025?",
    href: "#",
    author: { name: "Sam Rivera" },
    date: "2025-08-21",
    ratingPercent: 91,
  },
  {
    id: 3,
    title: "Fujifilm X100VI: Street shooter’s dream",
    href: "#",
    author: { name: "Jamie Lee" },
    date: "2025-08-20",
    ratingPercent: 88,
  },
];

// Using reusable HomeNewsCard component from ~/components/home/news-card

export default async function Home() {
  const posts = await getNewsPosts();
  const published = posts
    .filter((p) => p.status === "published")
    .sort((a, b) => {
      const da = new Date(
        (a as any).date_created as unknown as string,
      ).getTime();
      const db = new Date(
        (b as any).date_created as unknown as string,
      ).getTime();
      return db - da;
    });

  const toHomePost = (p: (typeof posts)[number]) => {
    const thumbId = (p as any).thumbnail as unknown as string | undefined;
    const image = thumbId
      ? `https://sharply-directus.onrender.com/assets/${thumbId}`
      : "/image-temp.png";
    const date = formatHumanDate((p as any).date_created as unknown as string);
    return {
      id: (p as any).id,
      title: (p as any).title as string,
      excerpt: stripHtml((p as any).news_content_wysiwyg as string),
      href: `/news/${(p as any).slug as string}`,
      image,
      date,
    };
  };

  const featuredPost = published[0] ? toHomePost(published[0]!) : null;
  const otherPosts = published.slice(1, 7).map(toHomePost);
  return (
    <div className="min-h-screen">
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
      <section className="mt-6 w-full px-4 sm:px-8">
        <div className="mx-auto grid max-w-[96rem] grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-10">
          {/* Left column */}
          <div className="hidden xl:col-span-2 xl:block">
            <div className="sticky top-24 space-y-3">
              <h2 className="text-3xl font-bold">About Sharply</h2>
              <p className="text-muted-foreground">
                Sharply is a contributor-driven photography platform for
                personalized comparisons, powered by the web's most
                comprehensive crowd-sourced specs.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <GearCounter />
                <ContributionCounter />
              </div>
              <div className="mt-8 flex items-center gap-4">
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
          </div>
          {/* Center column featured post */}
          <div className="xl:col-span-5">
            {featuredPost ? (
              <HomeNewsCard badge="Featured" post={featuredPost} />
            ) : null}

            {/* News feed continuing below the featured article */}
            <div className="mt-4 flex flex-col gap-4">
              {otherPosts.map((item) => (
                <HomeNewsCard key={item.id} post={item} />
              ))}
            </div>
          </div>
          {/* Right column smaller links/posts */}
          <div className="xl:col-span-3">
            <div className="flex h-full flex-col gap-4">
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
                  <TrendingList timeframe="30d" limit={10} />
                </Suspense>
                <Separator className="my-8" />
                <h2 className="text-2xl font-semibold">Latest Reviews</h2>
                {REVIEW_ITEMS.map((post) => (
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
