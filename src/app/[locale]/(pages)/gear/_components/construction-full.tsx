import { ArrowLeft,BookOpen,Wrench } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { TypingAnimation } from "~/components/ui/typing-animation";
import { SuggestEditButton } from "./suggest-edit-button";

export async function ConstructionFullPage(props: {
  gearName: string;
  missing: string[];
  slug: string;
  gearType: "CAMERA" | "ANALOG_CAMERA" | "LENS";
}) {
  const t = await getTranslations("underConstructionPage");
  const { gearName, missing, slug, gearType } = props;
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
            {t("missingKeySpecsLong")}
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
        label={t("contributeMissingInformation")}
      />

      <div className="mt-2 max-w-xl text-center">
        <h2 className="mb-2 text-sm font-semibold">
          {t("crowdSourcedTitle")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("crowdSourcedDescription")}
        </p>
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          icon={<ArrowLeft className="size-4" />}
        >
          <Link href="/gear">{t("backToGear")}</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          icon={<BookOpen className="size-4" />}
        >
          <Link href="/about">{t("learnMore")}</Link>
        </Button>
      </div>
    </div>
  );
}
