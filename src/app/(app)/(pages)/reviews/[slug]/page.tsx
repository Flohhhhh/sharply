import Image from "next/image";
import { getReviewBySlug } from "~/server/payload/service";
import { fetchGearBySlug } from "~/server/gear/service";
import { RichText } from "~/components/rich-text";
import { TableOfContents } from "~/components/rich-text/table-of-contents";
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
    <div className="mx-auto my-24 flex min-h-screen flex-col items-center gap-12 px-4 pt-8 sm:px-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-center text-4xl font-bold sm:text-6xl">
          {`${gearItem.name} Review`}
        </h1>
        <p className="text-muted-foreground max-w-3xl text-base sm:text-lg">
          {review.title}
        </p>
      </div>

      <div className="w-full max-w-5xl space-y-6">
        {gearItem.thumbnailUrl ? (
          <div className="bg-muted dark:bg-card min-h-[300px] overflow-hidden rounded-md p-6 sm:p-12">
            <Image
              src={gearItem.thumbnailUrl}
              alt={gearItem.name}
              className="mx-auto h-full max-h-[300px] w-full max-w-[600px] object-contain sm:max-h-[420px]"
              width={720}
              height={480}
              priority
            />
          </div>
        ) : (
          <div className="bg-muted dark:bg-card flex aspect-video items-center justify-center rounded-md">
            <div className="text-muted-foreground text-lg">
              No image available
            </div>
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="space-y-8 lg:space-y-10">
            <section id="review-content" className="space-y-6 lg:space-y-8">
              {/* Summary */}
              <div className="space-y-2">
                <h2 className="scroll-mt-24 text-lg font-semibold">Summary</h2>
                <p className="text-muted-foreground">{review.review_summary}</p>
              </div>

              {/* Pros & Cons */}
              <div className="space-y-4">
                <h2 className="scroll-mt-24 text-lg font-semibold">
                  Pros &amp; Cons
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded border border-green-400/50 bg-green-400/5 p-3">
                    <h3 className="text-lg font-semibold">The Good</h3>
                    <ul className="my-4 list-disc space-y-3 pl-5 text-sm text-green-600 dark:text-green-400">
                      {review.goodPoints.map((point) => (
                        <li key={point.id}>{point.goodNote}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded border border-red-400/50 bg-red-400/5 p-3">
                    <h3 className="scroll-mt-24 text-lg font-semibold">
                      The Bad
                    </h3>
                    <ul className="my-4 list-disc space-y-3 pl-5 text-sm text-red-600 dark:text-red-400">
                      {review.badPoints.map((point) => (
                        <li key={point.id}>{point.badNote}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Gear Specs */}
              <div className="space-y-3">
                <h3 className="scroll-mt-24 text-lg font-semibold">
                  View {gearItem.name} specs
                </h3>
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
              <div className="space-y-4">
                <h2 className="scroll-mt-24 text-lg font-semibold">
                  My Experience
                </h2>
                <RichText
                  data={review.reviewContent}
                  className="w-full max-w-none"
                />
              </div>

              {/* Genre Ratings */}
              <GenreRatings
                genreRatings={review.genreRatings ?? {}}
                gearName={gearItem.name}
              />
            </section>
          </div>

          <div>
            <div className="lg:sticky lg:top-24">
              <div className="rounded-2xl p-5 shadow-lg">
                <TableOfContents contentSelector="#review-content" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
