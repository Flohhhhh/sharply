"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="bg-background text-foreground flex min-h-screen flex-col items-start justify-center px-4 sm:px-8">
      <div className="container mx-auto flex w-full max-w-4xl flex-col items-start gap-8">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Sharply is under construction
        </h1>
        <p className="max-w-3xl text-lg text-black/80">
          We're building a modern, contributor-driven photography hub. A place
          where passionate photographers can explore in-depth gear specs, share
          real-world experiences, and discover tools that inspire.
          <br />
          <br />
          We're in the early stages of development, but we're already working on
          some cool features. If you're interested in helping us build this
          project, we'd love to have you on board.
        </p>
        <p className="text-lg text-black/80">
          Check out some sample content while we build!
        </p>
        <Link
          href="/gear"
          className="border-input bg-primary text-primary-foreground hover:bg-primary/90 rounded-md border px-6 py-3 text-lg font-medium"
        >
          Browse Gear
        </Link>
      </div>
    </main>
  );
}
