import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchClient } from "./search-client";
import { searchGear } from "~/server/search/service";

export const metadata: Metadata = {
  title: "Search",
  openGraph: {
    title: "Search",
  },
};

type SearchPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = typeof params?.q === "string" ? params.q.trim() : "";
  const hasQuery = Boolean(q);

  // SSR first page (newest) when no query is present
  const initialPage = hasQuery
    ? null
    : await searchGear({
        query: undefined,
        sort: "newest",
        page: 1,
        pageSize: 24,
        includeTotal: true,
        filters: undefined,
      });

  return (
    <main className="space-y-10 pt-24">
      <Suspense fallback={<div>Loading...</div>}>
        <SearchClient initialPage={initialPage} />
      </Suspense>
    </main>
  );
}
