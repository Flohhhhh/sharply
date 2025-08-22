import { ArrowRight, FileText } from "lucide-react";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "lucide-react";

type NewsItem = {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  readMinutes: number;
  image: string;
  href: string;
};

const FAKE_NEWS: NewsItem[] = [
  {
    id: 1,
    title: "Canon teases next-gen RF lens roadmap",
    excerpt:
      "A sneak peek at upcoming fast primes and zooms expected later this year.",
    date: "2025-08-20",
    readMinutes: 8,
    image: "/image-temp.png",
    href: "#",
  },
  {
    id: 2,
    title: "Nikon firmware adds subject detect upgrades",
    excerpt: "Improved AF tracking and bug fixes roll out to Z series bodies.",
    date: "2025-08-21",
    readMinutes: 6,
    image: "/image-temp.png",
    href: "#",
  },
  {
    id: 3,
    title: "Sony announces compact wide-angle prime",
    excerpt: "Lightweight build with weather sealing aimed at travel shooters.",
    date: "2025-08-22",
    readMinutes: 5,
    image: "/image-temp.png",
    href: "#",
  },
  {
    id: 4,
    title: "Fujifilm pushes major X-H3 video update",
    excerpt: "New codecs and improved thermal management highlighted in patch.",
    date: "2025-08-19",
    readMinutes: 7,
    image: "/image-temp.png",
    href: "#",
  },
  {
    id: 5,
    title: "Sigma releases roadmap for mirrorless trio",
    excerpt: "Fast apertures and compact sizes target hybrid creators.",
    date: "2025-08-18",
    readMinutes: 9,
    image: "/image-temp.png",
    href: "#",
  },
  {
    id: 6,
    title: "Leica firmware brings refined color profiles",
    excerpt:
      "Subtle tonal shifts and quality-of-life tweaks arrive across M line.",
    date: "2025-08-17",
    readMinutes: 4,
    image: "/image-temp.png",
    href: "#",
  },
];

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <a className="flex h-full flex-col rounded-xl border" href={item.href}>
      <div className="shrink-0 p-2">
        <img
          src={item.image}
          alt={item.title}
          className="aspect-video w-full rounded-lg object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col px-3 pt-2 pb-4">
        <h2 className="mb-1 font-medium">{item.title}</h2>
        <p className="text-muted-foreground line-clamp-2 text-sm">
          {item.excerpt}
        </p>
        <div className="mt-auto">
          <Separator className="my-5" />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground text-sm">{item.date}</span>
            <Badge variant="secondary" className="h-fit">
              {item.readMinutes} Min Read
            </Badge>
          </div>
        </div>
      </div>
    </a>
  );
}

export default function LatestNews() {
  return (
    <section className="mt-24 w-full px-4 sm:px-8">
      <div className="mx-auto max-w-[96rem]">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          {/* <Badge variant="outline" className="gap-1 py-1">
            <FileText className="h-full w-4" /> Our Blogs
          </Badge> */}
          <h1 className="text-4xl font-semibold text-balance">Latest News</h1>
          <p className="text-muted-foreground">
            Explore our blog for insightful articles, personal reflections and
            ideas that inspire action on the topics you care about.
          </p>
        </div>
        <div className="mt-20 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FAKE_NEWS.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Button variant="outline">
            View All Posts <ArrowRight className="ml-2 h-full w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
