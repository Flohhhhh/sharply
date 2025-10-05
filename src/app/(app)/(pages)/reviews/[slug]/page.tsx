import { getReviewBySlug } from "~/server/payload/service";
import { fetchGearBySlug } from "~/server/gear/service";
import { RichText } from "~/components/rich-text";
import { GearCardHorizontal } from "~/components/gear/gear-card-horizontal";
import { getBrandNameById } from "~/lib/mapping/brand-map";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const review = await getReviewBySlug(slug);
  const gearItem = await fetchGearBySlug(review.review_gear_item);
  const brandName = getBrandNameById(gearItem.brandId ?? "");

  return (
    <div className="mt-24 min-h-screen w-full px-4 sm:px-8">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-8">
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
        <div className="mt-4">
          <p className="text-muted-foreground">{review.review_summary}</p>
        </div>
        {/* Gear Card */}
        <div className="mt-4 space-y-2">
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
        {/* Review Content */}
        <div className="mt-4">
          <RichText data={review.reviewContent} />
        </div>
        {/* Pros/Cons */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold">The Good</h3>
            <ul className="list-disc pl-5 text-sm">
              {review.goodPoints.map((point) => (
                <li key={point.id}>{point.goodNote}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold">The Bad</h3>
            <ul className="list-disc pl-5 text-sm">
              {review.badPoints.map((point) => (
                <li key={point.id}>{point.badNote}</li>
              ))}
            </ul>
          </div>
        </div>
        {/* Genre Ratings */}
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Genre Ratings</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* genreRatings is a JSON object, not an array, so we need to iterate over its entries */}
            {review.genreRatings &&
              Object.entries(review.genreRatings).map(([genre, value]) => {
                let ratingLabel = "N/A";
                if (value === "1") ratingLabel = "Underperforms";
                else if (value === "2") ratingLabel = "Acceptable";
                else if (value === "3") ratingLabel = "Excels";
                return (
                  <div key={genre}>
                    <span className="font-medium">
                      {genre.charAt(0).toUpperCase() + genre.slice(1)}:
                    </span>{" "}
                    <span>{ratingLabel}</span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
