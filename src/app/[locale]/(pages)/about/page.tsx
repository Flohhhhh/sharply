import { Button } from "~/components/ui/button";
import {
  BadgeCheck,
  CheckCircle2,
  Flame,
  Heart,
  ScanHeart,
} from "lucide-react";
import Image from "next/image";
import Timeline from "./timeline";
import { AboutCta } from "./about-cta";
import { Badge } from "~/components/ui/badge";
import { ContributionCounter } from "~/components/home/contribution-counter";
import { GearCounter } from "~/components/home/gear-counter";
import type { Metadata } from "next";
import DiscordBanner from "~/components/discord-banner";
import { LocaleLink } from "~/components/locale-link";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutPage" });

  return buildLocalizedMetadata("/about", {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
  });
}

export default async function About({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutPage" });
  const valueCards = [
    {
      icon: Heart,
      title: t("valuesOpenTitle"),
      description: t("valuesOpenDescription"),
    },
    {
      icon: ScanHeart,
      title: t("valuesCommunityTitle"),
      description: t("valuesCommunityDescription"),
    },
    {
      icon: Flame,
      title: t("valuesModernTitle"),
      description: t("valuesModernDescription"),
    },
    {
      icon: BadgeCheck,
      title: t("valuesReliableTitle"),
      description: t("valuesReliableDescription"),
    },
  ];
  const timelineItems: [
    { title: string; description: string },
    { title: string; description: string },
    { title: string; description: string },
  ] = [
    {
      title: t("timelineStep1Title"),
      description: t("timelineStep1Description"),
    },
    {
      title: t("timelineStep2Title"),
      description: t("timelineStep2Description"),
    },
    {
      title: t("timelineStep3Title"),
      description: t("timelineStep3Description"),
    },
  ];

  return (
    <div className="mt-36 min-h-screen space-y-16">
      <h1 className="sr-only text-2xl font-bold">{t("pageTitle")}</h1>
      <section className="mx-auto w-full max-w-7xl space-y-8 px-4 sm:px-8">
        <div className="mb-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <h2 className="max-w-lg text-4xl font-bold sm:text-6xl">
            {t("heroTitle")}
          </h2>
          <p className="text-muted-foreground max-w-lg self-end">
            {t("heroDescription")}
          </p>
        </div>

        <div>
          <Image
            src="https://8v5lpkd4bi.ufs.sh/f/mJwI0W8NBfTnmxxvVcw8NBfTn68UzcGl7jKdovRxmIyCpLMV"
            alt="About"
            className="aspect-[21/9] w-full rounded-t-2xl object-cover"
            width={1000}
            height={1000}
          />
          <div className="bg-primary flex items-center justify-center gap-4 rounded-b-2xl p-4">
            <ScanHeart className="size-5 animate-pulse" />
            <p className="text-primary-foreground text-center text-sm">
              {t("heroBanner")}
            </p>
          </div>
        </div>
      </section>
      {/* future logo strip/cloud */}
      <section className="mx-auto w-full max-w-7xl space-y-8 px-4 pt-8 pb-16 sm:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div className="top-24 max-w-lg space-y-4">
            <Badge>{t("missionBadge")}</Badge>
            <h3 className="text-3xl font-bold">{t("missionTitle")}</h3>
            <p className="text-muted-foreground">{t("missionBody")}</p>
          </div>
          <div className="flex flex-col gap-3">
            {valueCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="bg-card flex items-start gap-4 rounded-md border p-5"
                >
                  <div className="bg-secondary flex h-12 w-12 shrink-0 items-center justify-center rounded">
                    <Icon className="text-foreground-muted w-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{card.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      {card.description}
                    </p>
                  </div>
                </div>
              );
            })}
            <Button asChild>
              <LocaleLink href="/gear">{t("databaseCta")}</LocaleLink>
            </Button>
          </div>
        </div>
      </section>

      <section className="dark:bg-accent/50 w-full space-y-8 bg-white">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-24 sm:grid-cols-2 sm:px-8">
          <div className="max-w-lg space-y-4">
            <Badge>{t("problemBadge")}</Badge>
            <h2 className="text-3xl font-bold">{t("problemTitle")}</h2>
            <p className="text-muted-foreground">{t("problemBody1")}</p>
            <p className="text-muted-foreground">{t("problemBody2")}</p>
            <p className="text-muted-foreground">{t("problemBody3")}</p>
          </div>
          <div className="max-w-lg space-y-4">
            <Badge>{t("solutionBadge")}</Badge>
            <h2 className="text-3xl font-bold">{t("solutionTitle")}</h2>
            <p className="text-muted-foreground">{t("solutionBody1")}</p>
            <p className="text-muted-foreground">{t("solutionBody2")}</p>
            <p className="text-muted-foreground">{t("solutionBody3")}</p>
            <p className="text-muted-foreground">{t("solutionBody4")}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl space-y-8 px-4 py-16 sm:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div className="top-24 max-w-lg space-y-4">
            <Badge>{t("workflowBadge")}</Badge>
            <h3 className="text-3xl font-bold">{t("workflowTitle")}</h3>
            <p className="text-muted-foreground max-w-lg">
              {t("workflowDescription")}
            </p>
            <div className="mt-12 flex gap-8">
              <GearCounter locale={locale} />
              <ContributionCounter locale={locale} />
            </div>
          </div>
          <Timeline items={timelineItems} />
        </div>
      </section>

      <section className="dark:bg-accent/50 mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 rounded-xl bg-white px-8 py-12 sm:grid-cols-2 sm:px-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">{t("ctaTitle")}</h2>
          <p className="text-muted-foreground">{t("ctaDescription")}</p>

          <AboutCta />
        </div>
        <div className="hidden max-w-md space-y-4 sm:block">
          <ul className="list-inside list-none space-y-4 pl-12">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400" />
              {t("checklistEditSpecs")}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400" />
              {t("checklistSaveCollection")}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400" />
              {t("checklistWriteReviews")}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400" />
              {t("checklistWishlist")}
            </li>
          </ul>
        </div>
      </section>
      <section className="mx-auto w-full max-w-7xl">
        <DiscordBanner />
      </section>
    </div>
  );
}
