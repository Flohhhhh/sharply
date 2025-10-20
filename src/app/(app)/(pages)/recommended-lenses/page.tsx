import Link from "next/link";
import { serviceListCharts } from "~/server/recommendations/service";
import { BrandBrowser } from "./_components/BrandBrowser";
import type { Metadata } from "next";

type ChartListItem = Awaited<ReturnType<typeof serviceListCharts>>[number];

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Recommended Lenses",
  openGraph: {
    title: "Recommended Lenses",
  },
};

export default async function Page() {
  const charts = await serviceListCharts();
  const brands = Array.from(new Set(charts.map((c: ChartListItem) => c.brand)));
  return (
    <div className="mx-auto mt-24 min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="space-y-10">
        <header className="space-y-3">
          <h1 className="text-4xl font-semibold">Recommended Lenses</h1>
          <p className="text-muted-foreground">
            Curated, practical lens picks by mount and sensor format. Each chart
            is kept small and opinionated so you can make a confident choice
            fast.
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="text-xl font-medium">How to read the charts</h2>
          <div className="text-muted-foreground space-y-1 text-sm">
            <p>
              We group lenses into simple ratings to reflect real-world use:
              "best value", "best performance", "balanced", and "situational".
            </p>
            <p>
              Notes call out why a lens made the list and any tradeoffs to
              consider.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium">Browse by brand</h2>
          <BrandBrowser
            charts={
              charts.map((c: ChartListItem) => ({
                brand: c.brand,
                slug: c.slug,
                title: c.title,
                updatedAt: (c.updatedDate as unknown as string) ?? "",
                items: [],
              })) as any
            }
          />
        </section>
      </div>
    </div>
  );
}
