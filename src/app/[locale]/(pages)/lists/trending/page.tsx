import { fetchTrendingPage } from "~/server/popularity/service";
import { TrendingTable } from "./_components/trending-table";
import type { Metadata } from "next";

const DEFAULT_TIMEFRAME: "7d" | "30d" = "30d";
const DEFAULT_PER_PAGE = 20;

export const metadata: Metadata = {
  title: "Trending Gear",
  description:
    "We track the popularity of cameras and lenses based on daily views, wishlist, ownership, and comparison activity on Sharply.",
  openGraph: {
    title: "Trending Gear",
    description:
      "We track the popularity of cameras and lenses based on daily views, wishlist, ownership, and comparison activity on Sharply.",
  },
};

export default async function TrendingPage() {
  const initialData = await fetchTrendingPage({
    timeframe: DEFAULT_TIMEFRAME,
    page: 1,
    perPage: DEFAULT_PER_PAGE,
  });

  return (
    <div className="mx-auto mt-10 w-full max-w-6xl px-4 py-10 sm:mt-16 sm:px-6 lg:px-0">
      <header className="mb-16 space-y-2">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <h1 className="text-3xl font-bold sm:text-5xl">Trending gear</h1>
          <p className="text-muted-foreground max-w-xl text-base">
            We track the popularity of cameras and lenses based on daily views,
            wishlist, ownership, and comparison activity on Sharply.
          </p>
        </div>
      </header>
      <TrendingTable initialData={initialData} />
    </div>
  );
}
