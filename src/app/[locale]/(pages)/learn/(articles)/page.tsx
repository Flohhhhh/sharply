import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";

export const metadata: Metadata = buildLocalizedMetadata("/learn", {
  title: "Learn Photography",
  description:
    "Explore photography guides from beginner fundamentals to deeper concepts and practical techniques.",
  openGraph: {
    title: "Learn Photography",
    description:
      "Explore photography guides from beginner fundamentals to deeper concepts and practical techniques.",
  },
});

export default function LearnPage() {
  const basicsArticles = [
    {
      href: "/learn/the-basics-of-modern-cameras",
      label: "Understanding Modern Cameras",
    },
    {
      href: "/learn/the-exposure-triangle",
      label: "The Exposure Triangle",
    },
    {
      href: "/learn/every-way-to-enjoy-photography",
      label: "Every Way to Enjoy Photography",
    },
  ];

  return (
    <>
      <h1 className="mt-2 text-2xl font-bold sm:text-4xl">Learn Photography</h1>
      <Image
        src={
          "https://8v5lpkd4bi.ufs.sh/f/mJwI0W8NBfTnqHKEP8nv1Vl6RCe4UNBwgbr5SnmLaEZODHjA"
        }
        alt={"Learn Photography"}
        className="aspect-[5/2] w-full rounded-lg object-cover"
        width={1280}
        height={720}
        priority
      />
      <div className="not-prose text-muted-foreground -mt-4 text-sm">
        <>
          Photo by{" "}
          <Link
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            href="https://unsplash.com/photos/camera-studio-set-up-aS4Duj2j7r4?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
          >
            Alexander Dummer
          </Link>
        </>
      </div>
      <p>
        Welcome to the Learn Photography section of Sharply. Here you can find
        comprehensive guides on everything from the basics of the exposure
        triangle to the advanced techniques used by professionals in different
        genres of photography.
      </p>
      <h2>Where to Start</h2>
      <p>
        Below is a list of recommended reads that will help you understand the
        most important concepts in photography in no time.
      </p>
      <ul className="not-prose mt-8 space-y-3">
        {basicsArticles.map((article) => (
          <li key={article.href}>
            <Link
              href={article.href}
              className="text-base font-medium text-zinc-200 underline-offset-2 transition hover:underline"
            >
              {article.label}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
