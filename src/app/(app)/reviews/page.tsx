import { ReviewCard } from "~/components/home/review-card";
import { getAllReviews } from "~/lib/directus";
import type { Review } from "~/lib/directus";
import Link from "next/link";

export default async function ReviewsPage() {
  const reviews = await getAllReviews();
  return (
    <ul>
      {reviews.map((review: Review) => (
        <li key={review.id}>
          <Link href={`/reviews/${review.slug}`}>{review.title}</Link>
        </li>
      ))}
    </ul>
  );
}
