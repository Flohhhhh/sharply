import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { GearCard } from "~/components/gear/gear-card";
import { getItemDisplayPrice } from "~/lib/mapping";
import { fetchPublicSharedListByParam } from "~/server/user-lists/service";

export const dynamic = "force-dynamic";

type SharedListPageProps = {
  params: Promise<{ shared: string }>;
};

export async function generateMetadata({
  params,
}: SharedListPageProps): Promise<Metadata> {
  const { shared } = await params;
  const payload = await fetchPublicSharedListByParam(shared).catch(() => null);

  if (!payload) {
    return {
      title: "List not found",
      robots: { index: false, follow: false },
    };
  }

  const ownerName =
    payload.owner.name || payload.owner.handle || "Sharply member";
  const title = `${payload.list.name} by ${ownerName}`;
  const description =
    payload.status === "published"
      ? `Shared gear list from ${ownerName}`
      : "This shared list is currently unpublished.";

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const imageUrl = baseUrl
    ? `${baseUrl}${payload.canonicalPath}/opengraph-image`
    : undefined;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    alternates: {
      canonical: baseUrl ? `${baseUrl}${payload.canonicalPath}` : undefined,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: baseUrl ? `${baseUrl}${payload.canonicalPath}` : undefined,
      images: imageUrl ? [{ url: imageUrl, alt: title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function SharedListPage({ params }: SharedListPageProps) {
  const { shared } = await params;
  const payload = await fetchPublicSharedListByParam(shared).catch(() => null);
  if (!payload) return notFound();

  if (payload.shouldRedirect) {
    redirect(payload.canonicalPath);
  }

  const ownerName =
    payload.owner.name || payload.owner.handle || "Sharply member";
  const profilePath = `/u/${payload.owner.handle}`;
  const trendingSet = new Set(payload.trendingSlugs);

  if (payload.status === "unpublished") {
    return (
      <main className="mx-auto mt-24 max-w-3xl space-y-6 px-4 py-10">
        <h1 className="text-4xl font-bold">{payload.list.name}</h1>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={payload.owner.image ?? undefined} alt={ownerName} />
            <AvatarFallback>{ownerName.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <Link href={profilePath} className="text-muted-foreground hover:underline">
            {ownerName}
          </Link>
        </div>
        <div className="text-muted-foreground rounded-lg border border-dashed p-6">
          This list has been unpublished by its owner.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto mt-24 max-w-6xl space-y-8 px-4 py-10">
      <header className="space-y-4">
        <h1 className="text-4xl font-bold sm:text-5xl">{payload.list.name}</h1>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={payload.owner.image ?? undefined} alt={ownerName} />
            <AvatarFallback>{ownerName.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <Link href={profilePath} className="text-muted-foreground hover:underline">
            {ownerName}
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3">
        {payload.items.map((item) => (
          <GearCard
            key={item.id}
            href={`/gear/${item.gear.slug}`}
            slug={item.gear.slug}
            name={item.gear.name}
            regionalAliases={item.gear.regionalAliases}
            brandName={item.gear.brandName}
            thumbnailUrl={item.gear.thumbnailUrl ?? undefined}
            gearType={item.gear.gearType}
            isTrending={trendingSet.has(item.gear.slug)}
            releaseDate={item.gear.releaseDate}
            releaseDatePrecision={item.gear.releaseDatePrecision}
            announcedDate={item.gear.announcedDate}
            announceDatePrecision={item.gear.announceDatePrecision}
            priceText={getItemDisplayPrice(item.gear, {
              style: "short",
              padWholeAmounts: true,
            })}
          />
        ))}
      </section>
    </main>
  );
}
