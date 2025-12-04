import Link from "next/link";
import Image from "next/image";
import { hallOfFameItems } from "./data";
import { fetchGearBySlug } from "~/server/gear/service";
import { TbLaurelWreath } from "react-icons/tb";
import { WreathIcon } from "./WreathIcon";
import { BlurFade } from "@/components/ui/blur-fade";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-static";

type DatePrecision = "DAY" | "MONTH" | "YEAR";

function pickBestDate(gear: {
  releaseDate: Date | null;
  releaseDatePrecision: DatePrecision | null;
  announcedDate: Date | null;
  announceDatePrecision: DatePrecision | null;
}): { date: Date; precision: DatePrecision } | null {
  const rel = gear.releaseDate;
  const relPrec = gear.releaseDatePrecision ?? (rel ? "DAY" : null);
  const ann = gear.announcedDate;
  const annPrec = gear.announceDatePrecision ?? (ann ? "DAY" : null);

  const rank = (p: DatePrecision | null) =>
    p === "DAY" ? 3 : p === "MONTH" ? 2 : p === "YEAR" ? 1 : 0;

  if (!rel && !ann) return null;
  if (rel && !ann) return { date: rel!, precision: relPrec! };
  if (!rel && ann) return { date: ann!, precision: annPrec! };

  // both exist -> choose higher precision; if tie, prefer release date
  if (rank(relPrec) > rank(annPrec)) return { date: rel!, precision: relPrec! };
  if (rank(annPrec) > rank(relPrec)) return { date: ann!, precision: annPrec! };
  return { date: rel!, precision: relPrec! };
}

function normalizeForSort(date: Date, precision: DatePrecision): Date {
  const d = new Date(date);
  if (precision === "DAY") return d;
  if (precision === "MONTH") {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  }
  // YEAR
  return new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
}

function formatForDisplay(date: Date, precision: DatePrecision): string {
  if (precision === "DAY") {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }
  if (precision === "MONTH") {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
    });
  }
  return date.toLocaleDateString(undefined, { year: "numeric" });
}

function isNotFoundError(error: unknown): error is { status?: number } {
  if (!error || typeof error !== "object") {
    return false;
  }

  const status = (error as { status?: unknown }).status;
  return typeof status === "number" && status === 404;
}

export default async function HallOfFamePage() {
  // Fetch gear for each entry at build time
  const rawEntries = await Promise.all(
    hallOfFameItems.map(async (item) => {
      const gear = await fetchGearBySlug(item.slug).catch((error) => {
        if (isNotFoundError(error)) {
          return null;
        }
        throw error;
      });

      if (!gear) {
        return null;
      }

      const best = pickBestDate(gear);
      return best
        ? {
            slug: item.slug,
            text: item.text,
            gear,
            bestDate: best.date,
            bestPrecision: best.precision,
            sortDate: normalizeForSort(best.date, best.precision),
          }
        : null;
    }),
  );

  const entries = rawEntries
    .filter((e): e is NonNullable<typeof e> => Boolean(e))
    .sort((a, b) => {
      // Newest first
      const diff = b.sortDate.getTime() - a.sortDate.getTime();
      if (diff !== 0) return diff;
      // Tie-breaker: more precise first
      const rank = (p: DatePrecision) =>
        p === "DAY" ? 3 : p === "MONTH" ? 2 : 1;
      return rank(b.bestPrecision) - rank(a.bestPrecision);
    });

  return (
    <div className="mx-auto mt-16 max-w-7xl px-4 py-10 sm:mt-24 sm:px-6 lg:px-8">
      {/* Hero section */}
      <div className="flex flex-col items-center justify-center gap-12 pb-16 sm:gap-24 sm:pb-24">
        <BlurFade className="flex flex-col items-center justify-center gap-2">
          <WreathIcon className="text-primary size-12" />
        </BlurFade>
        <BlurFade delay={0.1}>
          <h1 className="font-fancy mt-12 text-[4rem] leading-normal tracking-tight italic sm:text-[10rem] sm:leading-16">
            hall of fame
          </h1>
        </BlurFade>
        {/* 
          Use only one string for easy editing. 
          The following uses CSS columns to create a 2-column layout automatically on medium screens and above.
        */}
        <BlurFade delay={0.2}>
          <p className="text-muted-foreground max-w-xl text-center text-sm sm:text-left sm:text-base md:columns-2 md:gap-8">
            This hall of fame list collects some of the most iconic and
            influential gear in the history of photography. We curate this list
            to highlight the cameras and lenses that have had the most impact on
            the industry and the community over the years and those that are
            well known even today despite their age.
          </p>
        </BlurFade>
      </div>

      <div className="relative mt-24">
        <div className="space-y-2">
          <BlurFade delay={0.3} className="mb-16">
            <Separator />
          </BlurFade>
          {entries.length === 0 ? (
            <BlurFade delay={0.3}>
              <div className="text-muted-foreground flex flex-col items-center gap-4 rounded-lg border border-dashed px-6 py-12 text-center">
                <TbLaurelWreath className="text-primary size-12" />
                <p className="text-lg font-medium">
                  No hall of fame entries are available yet.
                </p>
                <p className="text-sm">
                  Add gear data to your local database and reload this page to
                  celebrate legendary equipment.
                </p>
              </div>
            </BlurFade>
          ) : (
            entries.map((entry, index) => {
              const title = entry.gear.brands?.name
                ? `${entry.gear.brands.name} ${entry.gear.name}`
                : entry.gear.name;
              const formattedDate = formatForDisplay(
                entry.bestDate,
                entry.bestPrecision,
              );
              return (
                <BlurFade
                  inView
                  delay={index === 0 ? 0.3 : 0}
                  key={entry.slug}
                  className="relative"
                >
                  <div className="flex flex-col gap-y-6 md:flex-row">
                    {/* Left column - sticky date + dot */}
                    <div className="relative flex-shrink-0 self-start pb-10 md:sticky md:top-24 md:z-20 md:w-48">
                      <time className="text-muted-foreground mb-3 block text-sm font-medium">
                        {formattedDate}
                      </time>
                      {/* Sticky timeline dot aligned to the divider */}
                      <span className="bg-primary ring-background absolute top-2 right-0 z-20 hidden h-3 w-3 translate-x-1/2 rounded-full ring-2 md:block" />
                    </div>

                    {/* Right column - content with timeline line + dot */}
                    <div className="relative flex-1 pb-10 md:pl-8">
                      {/* Vertical timeline line */}
                      <div className="bg-border pointer-events-none absolute top-2 left-0 z-0 hidden h-full w-px md:block" />

                      <div className="space-y-6">
                        <div className="relative z-10 flex flex-col gap-2">
                          <Link
                            href={`/gear/${entry.gear.slug}`}
                            className="hover:underline"
                          >
                            <h2 className="text-3xl font-semibold tracking-tight text-balance">
                              {title}
                            </h2>
                          </Link>
                        </div>

                        {/* Gear image with background styling like gear page */}
                        <div className="bg-muted dark:bg-card overflow-hidden rounded-md p-12 sm:p-24">
                          {entry.gear.thumbnailUrl ? (
                            <Image
                              src={entry.gear.thumbnailUrl}
                              alt={title}
                              className="mx-auto h-full max-h-[300px] w-full max-w-[600px] object-contain sm:max-h-[475px]"
                              width={720}
                              height={480}
                              priority
                            />
                          ) : (
                            <div className="flex aspect-video items-center justify-center">
                              <div className="text-muted-foreground text-lg">
                                No image available
                              </div>
                            </div>
                          )}
                        </div>

                        <p className="text-muted-foreground py-4">
                          {entry.text}
                        </p>
                      </div>
                    </div>
                  </div>
                </BlurFade>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
