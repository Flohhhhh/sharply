import { getReviews } from "~/server/payload/service";
import Link from "next/link";

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
