import Link from "next/link";
import { ArrowLeft, Book, BookOpen, Wrench, CheckCircle2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { SuggestEditButton } from "./suggest-edit-button";
import { TypingAnimation } from "~/components/ui/typing-animation";
import { Badge } from "~/components/ui/badge";

export function ConstructionFullPage(props: {
  gearName: string;
  missing: string[];
  editHref: string;
  slug: string;
  gearType: "CAMERA" | "LENS";
}) {
  const { gearName, missing, editHref, slug, gearType } = props;
  const missingCount = missing.length;
  const totalChecks = (() => {
    if (gearType === "LENS") return 5; // Brand, Mount, Focal length, Prime/Zoom, Max aperture
    let base = 4; // Brand, Mount, Sensor type, Sensor resolution
    if (missing.includes("Integrated lens focal length")) base += 1;
    return base;
  })();
  const completed = Math.max(0, totalChecks - missingCount);
  const progress = Math.max(
    0,
    Math.min(100, Math.round((completed / totalChecks) * 100)),
  );
  return (
    <div className="mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-6 py-8">
      <Wrench className="text-muted-foreground h-8 w-8" aria-hidden="true" />

      <TypingAnimation
        as="h1"
        words={[gearName]}
        blinkCursor={true}
        showCursor={true}
        className="text-center text-3xl font-bold tracking-tight sm:text-6xl"
      >
        {gearName}
      </TypingAnimation>

      {missing.length > 0 && (
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto mb-2 max-w-sm text-sm font-semibold">
            This page is under construction because we are missing the following
            key specs:
          </div>
          <div className="bg-accent/30 dark:bg-card/50 border-border rounded-lg border px-4 py-3">
            <div className="flex flex-col items-center justify-center gap-2">
              {missing.map((m) => (
                <Badge
                  key={m}
                  variant="outline"
                  className="bg-background px-6 py-1"
                >
                  {m}
                </Badge>
              ))}
            </div>
          </div>
          {/* <div className="mt-4">
            <div className="text-muted-foreground mb-1 text-xs">
              Core Specs completion
            </div>
            <Progress value={progress} />
            <div className="text-muted-foreground mt-1 text-xs">
              {completed}/{totalChecks} ({progress}%)
            </div>
          </div> */}
        </div>
      )}

      <SuggestEditButton
        slug={slug}
        gearType={gearType}
        label="Contribute missing information!"
      />

      <div className="mt-2 max-w-xl text-center">
        <h2 className="mb-2 text-sm font-semibold">
          Sharply is crowd-sourced!
        </h2>
        <p className="text-muted-foreground text-sm">
          We have a contributor-driven gear database with controlled
          crowd-sourcing. Members propose updates to technical specs, which are
          reviewed before going live. Approved contributions are credited on the
          page and count toward contributor recognition.
        </p>
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          icon={<ArrowLeft className="size-4" />}
        >
          <Link href="/gear">Back to Gear</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          icon={<BookOpen className="size-4" />}
        >
          <Link href="/about">Learn more</Link>
        </Button>
      </div>
    </div>
  );
}
