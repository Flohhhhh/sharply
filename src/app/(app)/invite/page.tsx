import Link from "next/link";
import { Button } from "~/components/ui/button";
import { SpinningText } from "~/components/ui/spinning-text";
import { BookOpen, UserPlus } from "lucide-react";
import { type Metadata } from "next";
import Logo from "public/logo";

export const metadata: Metadata = {
  title: "You're invited!",
  description:
    "You've been invited to join Sharply. Sign in to get early access and explore.",
  openGraph: {
    title: "You're invited!",
    description:
      "You've been invited to join Sharply. Sign in to get early access and explore.",
  },
};

export default function GenericInvitePage() {
  const signInHref = "/auth/signin?callbackUrl=%2Fauth%2Fwelcome";

  return (
    <div className="mx-auto flex h-screen flex-col items-center justify-between overflow-hidden py-12">
      {/* Soft colorful glow backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 flex items-center justify-center overflow-hidden"
      >
        <div className="size-[30rem] rounded-full bg-gradient-to-tr from-fuchsia-400/20 via-sky-400/20 to-amber-300/20 blur-3xl sm:size-[48rem]" />
      </div>

      {/* Top centered wordmark */}
      <div className="font-bold">Sharply</div>

      {/* Middle content */}
      <div className="flex flex-col items-center px-4 text-center sm:px-8">
        <div className="relative mb-36">
          <Logo className="dark:fill-foreground absolute top-0 left-0 h-16 w-16 -translate-x-1/2 -translate-y-1/2" />
          <SpinningText
            className="absolute top-3/7 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neutral-600 dark:text-neutral-400"
            radius={8}
            reverse
          >
            {"sharply • early access • founders • "}
          </SpinningText>
        </div>
        <h1 className="text-4xl font-bold text-balance sm:text-5xl">Welcome</h1>
        <p className="text-muted-foreground mt-3 max-w-prose text-base sm:text-lg">
          You’ve been invited to check out Sharply. Sign in to get early access
          and explore.
        </p>

        <div className="mt-10 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            className="w-full rounded-lg sm:w-auto"
            icon={<UserPlus />}
          >
            <Link href={signInHref}>Sign Up</Link>
          </Button>
        </div>
      </div>

      {/* Bottom-centered external link */}
      <Button asChild variant="outline" icon={<BookOpen />}>
        <Link
          href="https://western-butternut-9ba.notion.site/Sharply-Launch-Intro-Doc-2783c00bcee28087b889f64dcdb941ae?source=copy_link"
          target="_blank"
          rel="noopener noreferrer"
        >
          Read About the Project
        </Link>
      </Button>
    </div>
  );
}
