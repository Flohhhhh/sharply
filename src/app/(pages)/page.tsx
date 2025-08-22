import Link from "next/link";
import Image from "next/image";
import { Badge } from "~/components/ui/badge";
import { GlobalSearchBar } from "~/components/search/global-search-bar";
import { GearCounter } from "~/components/home/gear-counter";
import { ContributionCounter } from "~/components/home/contribution-counter";
import { Button } from "~/components/ui/button";
import { ArrowRightIcon, BookOpenIcon } from "lucide-react";
import BrandsStrip from "~/components/home/brands-strip";
import LatestContent from "~/components/home/latest-content";
import LatestNews from "~/components/home/latest-news";
import { Separator } from "~/components/ui/separator";

export default async function Home() {
  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="w-full pt-24">
        <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold tracking-tight md:text-6xl">
              Real specs, real reviews, real fast.
            </h1>
            <p className="text-muted-foreground mx-auto mt-2 max-w-2xl text-balance">
              Independent reviews, real specs, and side-by-side comparisons.
            </p>

            {/* Search box */}
            <div className="mx-auto mt-12 w-full max-w-7xl">
              <div className="relative">
                <GlobalSearchBar size="lg" />
              </div>

              {/* <ScopeChips /> */}
            </div>
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
      <section className="mt-12 w-full px-4 sm:px-8">
        <div className="mx-auto grid max-w-[96rem] grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-10">
          {/* Left column */}
          <div className="hidden space-y-3 xl:col-span-2 xl:block">
            <h2 className="text-3xl font-bold">About the site</h2>
            <p className="text-muted-foreground">
              Sharply is a contributor-driven photography platform for
              personalized comparisons, powered by the web's most comprehensive
              crowd-sourced specs.
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
          {/* Center column featured post */}
          <div className="xl:col-span-5">
            <article className="group bg-background flex h-full flex-col overflow-hidden rounded-xl border shadow-sm">
              <div className="shrink-0 p-2">
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    src="/image-temp.png"
                    alt="Featured post image"
                    fill
                    priority
                    className="rounded-lg object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge>Featured</Badge>
                  </div>
                </div>
              </div>
              <div className="flex flex-1 flex-col px-3 pt-2 pb-4">
                <h3 className="text-xl font-semibold">
                  Nikon Releases Mark II version of the 24-70 f/2.8 S
                </h3>
                <p className="text-muted-foreground mt-1">
                  Nikon has released the Mark II version of the 24-70 f/2.8 S
                  lens. This is the second version of the lens, which was
                  originally released in 2014. The new version is said to be
                  faster and more accurate.
                </p>
                <div className="mt-auto">
                  <Separator className="my-5" />
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground text-sm">
                      2025-08-22
                    </span>
                    <Badge variant="secondary" className="h-fit">
                      8 Min Read
                    </Badge>
                  </div>
                </div>
              </div>
            </article>
          </div>
          {/* Right column smaller links/posts */}
          <div className="xl:col-span-3">
            <div className="flex h-full flex-col gap-4">
              {/* Compact latest review card */}
              <article className="group bg-background flex flex-col overflow-hidden rounded-xl border shadow-sm">
                <div className="shrink-0 p-1">
                  <div className="relative aspect-[16/9] w-full">
                    <Image
                      src="/image-temp.png"
                      alt="Latest review image"
                      fill
                      className="rounded-lg object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge>Latest Review</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex flex-1 flex-col px-3 pt-2 pb-3">
                  <h4 className="text-sm font-semibold">Latest review title</h4>
                  <div className="mt-auto">
                    <Separator className="my-3" />
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground text-sm">
                        2025-08-22
                      </span>
                    </div>
                  </div>
                </div>
              </article>
              {/* Banner link: New to Photography? */}
              <Link
                href="/beginners-guide"
                className="bg-muted/40 hover:bg-muted/50 flex flex-col gap-2 overflow-hidden rounded-xl border p-5 transition-colors"
              >
                <h3 className="text-2xl font-semibold">New to Photography?</h3>
                <p className="text-muted-foreground mt-1">
                  We've put together a beginners guide to everything you need to
                  know to get started! View our step-by-step guide series.
                </p>
                <Button
                  className="mt-auto hover:cursor-pointer"
                  icon={<BookOpenIcon className="h-4 w-4" />}
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BRANDS STRIP */}
      <BrandsStrip />

      {/* LATEST NEWS */}
      {/* <LatestContent /> */}

      <LatestNews />
    </div>
  );
}
