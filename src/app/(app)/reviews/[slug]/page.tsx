import type { Metadata } from "next";
import type { Review } from "~/lib/directus";
import { getAllReviews, getReviewBySlug } from "~/lib/directus";
import { fetchGearMetadataById } from "~/server/gear/service";
import { getBrandNameById } from "~/lib/mapping/brand-map";

export async function generateStaticParams() {
  const reviews = await getAllReviews();
  return reviews.map((review: Review) => ({ slug: review.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const review = await getReviewBySlug(slug);
  return {
    title: `${review[0]?.title}`,
  };
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const review = await getReviewBySlug(slug);
  if (!review[0]?.review_gear_item) {
    return <div>Review not found</div>;
  }
  const gear = await fetchGearMetadataById(review[0]!.review_gear_item);
  const brandName = getBrandNameById(gear.brandId);
  console.log("gear", gear);
  return (
    <div>
      {review[0]?.title} {gear.name} {brandName}
    </div>
  );
}
