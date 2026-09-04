import type { Metadata } from "next";
import { Suspense } from "react";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";
import { hasActiveSearchState } from "~/lib/search/has-active-search-state";
import { searchGear } from "~/server/search/service";
import { fetchPublicTagOptions } from "~/server/tags/service";
import { NaturalLanguageSearchToast } from "./natural-language-search-toast";
import { SearchClient } from "./search-client";
import { SearchPageSkeleton } from "./search-page-skeleton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildLocalizedMetadata(
    "/search",
    {
      title: "Search",
      openGraph: {
        title: "Search",
      },
    },
    locale,
  );
}

type SearchPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const hasSearchState = hasActiveSearchState(params);

  // SSR first page (newest) when no query is present
  const initialPagePromise = hasSearchState
    ? Promise.resolve(null)
    : searchGear({
        query: undefined,
        sort: "newest",
        page: 1,
        pageSize: 24,
        includeTotal: true,
        includeConstructionState: true,
        filters: undefined,
      });
  const [initialPage, tagOptions] = await Promise.all([
    initialPagePromise,
    fetchPublicTagOptions(),
  ]);

  return (
    <main className="min-h-screen space-y-10 pt-24">
      <NaturalLanguageSearchToast />
      <Suspense fallback={<SearchPageSkeleton />}>
        <SearchClient initialPage={initialPage} tagOptions={tagOptions} />
      </Suspense>
    </main>
  );
}
