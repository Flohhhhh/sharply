import { getReviews } from "~/server/payload/service";
import Link from "next/link";
import type { Metadata } from "next";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";

export const metadata: Metadata = buildLocalizedMetadata("/reviews", {
  title: "Reviews",
  openGraph: {
    title: "Reviews",
  },
});

export default async function ReviewsPage() {
  const reviews = await getReviews();
  return (
    <div className="mt-24 w-full px-4 sm:px-8">
      {reviews.map((review) => (
        <Link key={review.id} href={`/reviews/${review.slug}`}>
          {review.title}
        </Link>
      ))}
    </div>
  );
}
