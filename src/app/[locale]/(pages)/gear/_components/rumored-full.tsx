import { ArrowLeft, BookOpen, HatGlasses } from "lucide-react-motion";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { BlurFade } from "~/components/ui/blur-fade";
import { DiaTextReveal } from "~/components/ui/dia-text-reveal";
import { Button } from "~/components/ui/button";
import { RumoredEditCta } from "./rumored-edit-cta";

export async function RumoredFullPage(props: {
  gearName: string;
  slug: string;
}) {
  const [t, constructionT] = await Promise.all([
    getTranslations("gearDetail"),
    getTranslations("underConstructionPage"),
  ]);
  const { gearName, slug } = props;

  return (
    <div className="mx-auto flex min-h-[70vh] flex-col items-center justify-center gap-6 py-8 text-center">
      <BlurFade delay={0} offset={10}>
        <HatGlasses
          className="text-muted-foreground h-16 w-16 sm:h-20 sm:w-20"
          aria-hidden="true"
          trigger="in-view"
        />
      </BlurFade>

      <BlurFade delay={0.05} offset={14} className="space-y-3">
        <h1 className="text-center text-3xl font-bold tracking-tight sm:text-6xl">
          <DiaTextReveal text={gearName} />
        </h1>
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {t("rumoredItemHeader")}
        </h2>
      </BlurFade>

      <BlurFade
        delay={0.1}
        offset={18}
        className="text-muted-foreground max-w-2xl text-sm sm:text-base"
      >
        <p>{t("rumoredItemBody")}</p>
      </BlurFade>

      <div className="flex h-9 items-center justify-center">
        <BlurFade delay={0.15} offset={22}>
          <RumoredEditCta slug={slug} label={t("rumoredItemEditCta")} />
        </BlurFade>
      </div>

      <BlurFade
        delay={0.2}
        offset={26}
        className="flex flex-wrap items-center justify-center gap-3"
      >
        <Button
          asChild
          variant="outline"
          size="sm"
          icon={<ArrowLeft className="size-4" />}
        >
          <Link href="/gear">{t("rumoredItemBackToGear")}</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          icon={<BookOpen className="size-4" />}
        >
          <Link href="/about">{constructionT("learnMore")}</Link>
        </Button>
      </BlurFade>
    </div>
  );
}
