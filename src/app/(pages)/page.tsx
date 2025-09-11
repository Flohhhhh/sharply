import Link from "next/link";
import Image from "next/image";
import { Badge } from "~/components/ui/badge";
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

type NewsItem = {
  id: number;
  title: string;
  excerpt: string;
  href: string;
  image: string;
  date: string;
  readMinutes: number;
};

const NEWS_ITEMS: NewsItem[] = [
  {
    id: 1,
    title: "Canon teases next-gen RF lens roadmap",
    excerpt:
      "A sneak peek at upcoming fast primes and zooms expected later this year.",
    href: "#",
    image: "/image-temp.png",
    date: "2025-08-20",
    readMinutes: 8,
  },
  {
    id: 2,
    title: "Nikon firmware adds subject detect upgrades",
    excerpt: "Improved AF tracking and bug fixes roll out to Z series bodies.",
    href: "#",
    image: "/image-temp.png",
    date: "2025-08-21",
    readMinutes: 6,
  },
  {
    id: 3,
    title: "Sony announces compact wide-angle prime",
    excerpt: "Lightweight build with weather sealing aimed at travel shooters.",
    href: "#",
    image: "/image-temp.png",
    date: "2025-08-22",
    readMinutes: 5,
  },
  {
    id: 4,
    title: "Fujifilm pushes major X-H3 video update",
    excerpt: "New codecs and improved thermal management highlighted in patch.",
    href: "#",
    image: "/image-temp.png",
    date: "2025-08-19",
    readMinutes: 7,
  },
  {
    id: 5,
    title: "Sigma releases roadmap for mirrorless trio",
    excerpt: "Fast apertures and compact sizes target hybrid creators.",
    href: "#",
    image: "/image-temp.png",
    date: "2025-08-18",
    readMinutes: 9,
  },
  {
    id: 6,
    title: "Leica firmware brings refined color profiles",
    excerpt:
      "Subtle tonal shifts and quality-of-life tweaks arrive across M line.",
    href: "#",
    image: "/image-temp.png",
    date: "2025-08-17",
    readMinutes: 4,
  },
];

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
            <HomeNewsCard
              badge="Featured"
              post={{
                id: "featured-1",
                title: "Nikon Releases Mark II version of the 24-70 f/2.8 S",
                excerpt:
                  "Nikon has released the Mark II version of the 24-70 f/2.8 S lens. This is the second version of the lens, which was originally released in 2014. The new version is said to be faster and more accurate.",
                href: "#",
                image: "/image-temp.png",
                date: "2025-08-22",
                readMinutes: 8,
              }}
            />

            {/* News feed continuing below the featured article */}
            <div className="mt-4 flex flex-col gap-4">
              {NEWS_ITEMS.map((item) => (
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
                className="flex flex-col gap-2 overflow-hidden rounded-xl border bg-white p-5 transition-colors"
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
