import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";
import { shouldPrebuildRecommendedLensesCharts } from "~/lib/static-generation";
import {
  serviceGetChart,
  serviceListChartParams,
} from "~/server/recommendations/service";
import { ChartView } from "../../_components/ChartView";

export const revalidate = 86400;

export async function generateStaticParams() {
  if (!shouldPrebuildRecommendedLensesCharts()) {
    return [];
  }

  return serviceListChartParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string; slug: string }>;
}): Promise<Metadata> {
  const { brand, slug } = await params;
  const result = await serviceGetChart(brand, slug);
  if (!result) {
    return {
      title: "Chart Not Found",
      openGraph: {
        title: "Chart Not Found",
      },
    };
  }
  return {
    ...buildLocalizedMetadata(`/recommended-lenses/${brand}/${slug}`, {
      title: result.title,
      openGraph: {
        title: result.title,
      },
    }),
  };
}

export default async function Page(props: {
  params: Promise<{ brand: string; slug: string }>;
}) {
  const params = await props.params;
  const result = await serviceGetChart(params.brand, params.slug);
  if (!result) return notFound();
  // Adapt service result (which returns items grouped by column) into ChartView's expected shape
  const items: any[] = [];
  for (const [colKey, list] of Object.entries(result.itemsByColumn)) {
    for (const it of list as any[]) items.push({ ...it, column: colKey });
  }
  // Use ChartView with computed columns via service by adapting props
  return (
    <div className="mt-24 min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <ChartView
        chart={
          {
            brand: params.brand,
            slug: params.slug,
            title: result.title,
            updatedAt: result.updatedAt,
            items,
            columns: result.columns,
          } as any
        }
      />
    </div>
  );
}
