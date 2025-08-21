import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

function ScopeChips() {
  const chips = ["Gear", "Reviews", "Compare", "News"];
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
      {chips.map((c) => (
        <Badge
          key={c}
          variant="secondary"
          className="rounded-full px-3 py-1 text-xs"
        >
          {c}
        </Badge>
      ))}
    </div>
  );
}

export default async function Home() {
  return (
    <>
      {/* HERO */}
      <section className="bg-muted/20 w-full border-b">
        <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Serious gear. Smarter choices.
            </h1>
            <p className="text-muted-foreground mx-auto mt-2 max-w-2xl text-balance">
              Independent reviews, real specs, and side-by-side comparisons.
            </p>

            {/* Search box */}
            <div className="mx-auto mt-5 w-full max-w-[min(560px,42vw)]">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 opacity-60" />
                <Input
                  aria-label="Search"
                  placeholder="Search cameras, lenses, or compare models…"
                  className="h-14 rounded-xl border-2 pl-9 shadow-[inset_0_1px_0_rgba(0,0,0,.04)]"
                />
              </div>
              <p className="text-muted-foreground mt-2 text-center text-xs">
                Try “Nikon Z6 II”, “R6 II vs A7 IV”, “35mm f/1.8 Z mount”
              </p>
              <ScopeChips />
            </div>

            <Link
              href="/about/how-we-test"
              className="text-primary mt-4 inline-block text-sm underline-offset-4 hover:underline"
            >
              How we test
            </Link>
          </div>
        </div>
      </section>

      {/* CONTENT STARTS IMMEDIATELY AFTER HERO */}
      <section className="mx-auto max-w-7xl px-4 pt-6 pb-10">
        <h2 className="mb-3 text-xl font-semibold">Latest</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {/* Large lead card */}
          <article className="rounded-2xl border p-4 md:col-span-6">
            <h3 className="text-lg leading-snug font-semibold">
              Canon R6 II vs Sony A7 IV. Which fits wedding work
            </h3>
            <p className="text-muted-foreground mt-2 line-clamp-3 text-sm">
              Autofocus behavior, skin tones, and battery life compared in the
              field.
            </p>
          </article>

          {/* Three supporting cards */}
          <div className="grid gap-4 md:col-span-6">
            <article className="rounded-2xl border p-4">
              <h3 className="text-base font-semibold">
                Best budget 35 mm primes right now
              </h3>
            </article>
            <article className="rounded-2xl border p-4">
              <h3 className="text-base font-semibold">
                Editor note. How we score stabilization
              </h3>
            </article>
            <article className="rounded-2xl border p-4">
              <h3 className="text-base font-semibold">
                Firmware roundup. Nikon, Canon, Sony
              </h3>
            </article>
          </div>
        </div>

        {/* Commonly visited content */}
        <div className="mt-8">
          <h2 className="mb-3 text-xl font-semibold">Popular</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {[
              "Lens Finder",
              "Camera Guides",
              "Compare Tool",
              "Best Value Picks",
              "Beginner Tips",
              "Deals",
            ].map((x) => (
              <Link
                key={x}
                href="/"
                className="hover:bg-muted rounded-lg border px-3 py-2 text-sm"
              >
                {x}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
