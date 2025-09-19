import Link from "next/link";
import { CheckCircle2, Image as ImageIcon, Sparkles } from "lucide-react";
import { Button } from "~/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome!",
};

export default function WelcomePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-12 md:py-20">
      <div className="overflow-hidden rounded-xl border md:grid md:min-h-[520px] md:grid-cols-2">
        <div className="bg-white p-8 md:border-r md:p-10">
          <div className="mb-6 flex items-center gap-3">
            <span className="rounded-full border p-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome to Sharply!
            </h1>
          </div>
          <p className="text-muted-foreground mb-8 text-sm">
            Your account is ready. Thanks for joining the community!
          </p>

          <div className="space-y-4">
            <h2 className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
              You can now
            </h2>
            <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed">
              <li>Contribute and refine gear specifications</li>
              <li>Submit gear proposals and suggest corrections</li>
              <li>Track your collection and wishlists</li>
              <li>Write reviews and share real-world experiences</li>
              <li>Follow brands and mounts to get updates</li>
              <li>Bookmark gear, news, and comparisons for later</li>
            </ul>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/gear">Explore gear</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/">Go to homepage</Link>
            </Button>
          </div>

          <p className="text-muted-foreground mt-8 text-xs">
            Thank you for helping make photography data clearer and more
            accessible for everyone.
          </p>
        </div>

        <div className="bg-muted/40 relative hidden md:block">
          <div className="absolute inset-0 grid place-items-center">
            <div className="bg-background text-muted-foreground relative flex h-28 w-28 items-center justify-center rounded-full border">
              <ImageIcon className="h-9 w-9" />
              <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-yellow-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
