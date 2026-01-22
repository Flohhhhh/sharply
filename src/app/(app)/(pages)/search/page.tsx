import type { Metadata } from "next";
import { useQueryState } from "nuqs";
import { SearchClient } from "./search-client";
import { GlobalSearchBar } from "~/components/search/global-search-bar";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Search",
  openGraph: {
    title: "Search",
  },
};

export default function SearchPage() {
  return (
    <main className="space-y-10 pt-24">
      <Suspense fallback={<div>Loading...</div>}>
        <SearchClient />
      </Suspense>
    </main>
  );
}
