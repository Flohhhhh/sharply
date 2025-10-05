import { getReviewBySlug } from "~/server/payload/service";
import { fetchGearBySlug } from "~/server/gear/service";
import { RichText } from "~/components/rich-text";
import { GearCardHorizontal } from "~/components/gear/gear-card-horizontal";
import { getBrandNameById } from "~/lib/mapping/brand-map";
import { notFound } from "next/navigation";
import { GenreRatings } from "../_components/genre-ratings";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const review = await getReviewBySlug(slug);

  if (!review) {
    return notFound();
  }

  const gearItem = await fetchGearBySlug(review.review_gear_item);
  const brandName = getBrandNameById(gearItem.brandId ?? "");

  return (
    <div className="mt-24 min-h-screen w-full px-4 sm:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 sm:px-8">
        <h1 className="text-4xl font-semibold">{review.title}</h1>
        <p className="text-muted-foreground">{gearItem.name}</p>
        {/* Image */}
        <div>
          {gearItem.thumbnailUrl ? (
            <div className="bg-muted h-[550px] overflow-hidden rounded-md py-12">
              <img
                src={gearItem.thumbnailUrl}
                alt={gearItem.name}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="bg-muted flex aspect-video items-center justify-center rounded-md">
              <div className="text-muted-foreground text-lg">
                No image available
              </div>
            </div>
          )}
        </div>
        {/* Review Summary */}
        <div className="mx-auto mt-8 max-w-3xl space-y-2">
          <h2 className="text-lg font-semibold">Summary</h2>
          <p className="text-muted-foreground">{review.review_summary}</p>
        </div>
        {/* Gear Card */}
        <div className="mx-auto mt-4 max-w-3xl space-y-2">
          <h3 className="text-lg font-semibold">View {gearItem.name} specs</h3>
          <GearCardHorizontal
            slug={gearItem.slug}
            name={gearItem.name}
            thumbnailUrl={gearItem.thumbnailUrl}
            brandName={brandName ?? ""}
            gearType={gearItem.gearType}
            href={`/gear/${gearItem.slug}`}
          />
        </div>
        {/* Pros/Cons */}
        <div className="mx-auto mt-4 max-w-3xl space-y-4">
          <h2 className="text-lg font-semibold">Pros & Cons</h2>
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3">
            <div className="rounded border border-green-400/50 bg-green-400/5 p-3">
              <h3 className="text-lg font-semibold">The Good</h3>
              <ul className="my-4 list-disc space-y-3 pl-5 text-sm text-green-600 dark:text-green-400">
                {review.goodPoints.map((point) => (
                  <li key={point.id}>{point.goodNote}</li>
                ))}
              </ul>
            </div>

            <div className="rounded border border-red-400/50 bg-red-400/5 p-3">
              <h3 className="text-lg font-semibold">The Bad</h3>
              <ul className="my-4 list-disc space-y-3 pl-5 text-sm text-red-600 dark:text-red-400">
                {review.badPoints.map((point) => (
                  <li key={point.id}>{point.badNote}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        {/* Review Content */}
        <div className="mx-auto mt-4 max-w-3xl space-y-4">
          <h2 className="text-lg font-semibold">My Experience</h2>
          <RichText data={review.reviewContent} className="w-full max-w-none" />
        </div>
        {/* Genre Ratings */}
        <GenreRatings
          genreRatings={review.genreRatings ?? {}}
          gearName={gearItem.name}
        />
      </div>
    </div>
  );
}
