import Image from "next/image";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";

type NewsItem = {
  id: number;
  title: string;
  excerpt: string;
  href: string;
  image: string;
};

type ReviewItem = {
  id: number;
  title: string;
  excerpt: string;
  href: string;
  image: string;
};

const FAKE_NEWS: NewsItem[] = [
  {
    id: 1,
    title: "Canon teases next-gen RF lens roadmap",
    excerpt:
      "A sneak peek at upcoming fast primes and zooms expected later this year.",
    href: "#",
    image: "/image-temp.png",
  },
  {
    id: 2,
    title: "Nikon firmware adds subject detect upgrades",
    excerpt: "Improved AF tracking and bug fixes roll out to Z series bodies.",
    href: "#",
    image: "/image-temp.png",
  },
  {
    id: 3,
    title: "Sony announces compact wide-angle prime",
    excerpt: "Lightweight build with weather sealing aimed at travel shooters.",
    href: "#",
    image: "/image-temp.png",
  },
  {
    id: 4,
    title: "Fujifilm pushes major X-H3 video update",
    excerpt: "New codecs and improved thermal management highlighted in patch.",
    href: "#",
    image: "/image-temp.png",
  },
  {
    id: 5,
    title: "Sigma releases roadmap for mirrorless trio",
    excerpt: "Fast apertures and compact sizes target hybrid creators.",
    href: "#",
    image: "/image-temp.png",
  },
  {
    id: 6,
    title: "Leica firmware brings refined color profiles",
    excerpt:
      "Subtle tonal shifts and quality-of-life tweaks arrive across M line.",
    href: "#",
    image: "/image-temp.png",
  },
];

const FAKE_REVIEWS: ReviewItem[] = [
  {
    id: 1,
    title: "Nikon Z 24-70mm f/2.8 S: Long-term review",
    excerpt:
      "Why this workhorse zoom still sets the standard for pro shooters.",
    href: "#",
    image: "/image-temp.png",
  },
  {
    id: 2,
    title: "Sony a7 IV: The hybrid king in 2025?",
    excerpt: "A balanced body that nails photo and video without compromise.",
    href: "#",
    image: "/image-temp.png",
  },
  {
    id: 3,
    title: "Fujifilm X100VI: Street shooter’s dream",
    excerpt: "Classic handling meets modern AF and a sharper lens.",
    href: "#",
    image: "/image-temp.png",
  },
];

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <article className="group bg-background overflow-hidden rounded-xl border shadow-sm">
      <div className="relative aspect-[16/9] w-full">
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="object-cover"
        />
        <div className="absolute top-2 left-2">
          <Badge>News</Badge>
        </div>
      </div>
      <div className="p-4">
        <h4 className="text-base font-semibold">{item.title}</h4>
        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
          {item.excerpt}
        </p>
        <Link
          href={item.href}
          className="text-primary mt-2 inline-block text-sm underline-offset-4 hover:underline"
        >
          Read more
        </Link>
      </div>
    </article>
  );
}

function ReviewCard({ item }: { item: ReviewItem }) {
  return (
    <article className="group bg-background overflow-hidden rounded-xl border shadow-sm">
      <div className="relative aspect-[16/9] w-full">
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="object-cover"
        />
        <div className="absolute top-2 left-2">
          <Badge>Review</Badge>
        </div>
      </div>
      <div className="p-3">
        <h4 className="text-base font-semibold">{item.title}</h4>
        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
          {item.excerpt}
        </p>
        <Link
          href={item.href}
          className="text-primary mt-2 inline-block text-sm underline-offset-4 hover:underline"
        >
          Read review
        </Link>
      </div>
    </article>
  );
}

export default function LatestContent() {
  return (
    <section className="w-full px-4 sm:px-8">
      <div className="mx-auto max-w-[96rem]">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-10">
          {/* Sidebar placeholder (blank for now) */}
          <div className="hidden xl:col-span-2 xl:block" />
          {/* News area: spans 5 columns on xl, single-column list */}
          <div className="xl:col-span-5">
            <h2 className="mb-3 text-lg font-bold">Latest News</h2>
            <div className="flex flex-col gap-4">
              {FAKE_NEWS.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          </div>
          {/* Reviews area: spans 3 columns on xl */}
          <div className="xl:col-span-3">
            <h3 className="mb-3 text-lg font-bold">Latest Reviews</h3>
            <div className="flex h-full flex-col gap-4">
              {FAKE_REVIEWS.map((item) => (
                <ReviewCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
