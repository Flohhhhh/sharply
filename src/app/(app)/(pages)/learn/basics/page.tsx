import { Library } from "lucide-react";
import Link from "next/link";
import LearnCard from "~/components/learn/learn-card";
import { Button } from "~/components/ui/button";

export default function BasicsPage() {
  const featured = [
    {
      href: "/learn/basics/camera-basics",
      title: "Camera Basics",
      description:
        "Understand the parts of a camera and how they work together.",
    },
    {
      href: "/learn/basics/buying-your-first-camera",
      title: "Buying Your First Camera",
      description: "How to choose a body, lenses, and a starter kit on budget.",
    },
    {
      href: "/learn/basics/exposure-triangle",
      title: "The Exposure Triangle",
      description:
        "Aperture, shutter speed, and ISO—how each affects your image.",
    },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-7xl p-6 pt-36">
      <div className="grid gap-4 sm:gap-12 md:grid-cols-[360px_1fr]">
        <aside className="space-y-3">
          <h1 className="text-3xl font-bold sm:text-5xl">The Basics</h1>
          <p className="text-muted-foreground text-sm">
            Here you can find a comprehensive guide to the basics of photography
            and photography gear. These guides will set you up for success with
            your first camera, and help you understand the basics of
            photography.
          </p>
          <Button
            asChild
            icon={<Library className="size-4" />}
            className="mt-8"
          >
            <Link href="/learn">View all learning</Link>
          </Button>
        </aside>

        <section className="space-y-4">
          {featured.map((item, idx) => (
            <LearnCard
              key={item.href}
              href={item.href}
              title={item.title}
              description={item.description}
              step={idx + 1}
            />
          ))}
        </section>
      </div>

      <div className="mt-12">
        {/* Full-width list of other pages will go here later */}
      </div>
    </main>
  );
}
