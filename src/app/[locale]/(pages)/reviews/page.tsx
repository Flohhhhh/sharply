import { getReviews } from "~/server/payload/service";
import Link from "next/link";
import type { Metadata } from "next";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "reviewPage" });

  return buildLocalizedMetadata("/reviews", {
    title: t("reviewsTitle"),
    openGraph: {
      title: t("reviewsTitle"),
    },
  });
}

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
