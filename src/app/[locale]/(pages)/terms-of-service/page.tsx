import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LocaleLink } from "~/components/locale-link";
import { ScrollProgress } from "~/components/ui/skiper-ui/scroll-progress";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";

export const metadata: Metadata = buildLocalizedMetadata("/terms-of-service", {
  title: "Terms of Service",
  openGraph: {
    title: "Terms of Service",
  },
});

export default async function TermsOfServicePage() {
  const t = await getTranslations("legal.terms");
  const tCommon = await getTranslations("common");

  return (
    <div className="mx-auto mt-24 min-h-screen max-w-3xl px-6 pb-24">
      <article className="prose prose-zinc prose-sm dark:prose-invert">
        <h1>{t("title")}</h1>
        <p>
          <em>{t("lastUpdated")}</em>
        </p>
        <p>{t("intro")}</p>
        <p>
          {t.rich("privacyNotice", {
            privacyPolicy: () => (
              <LocaleLink href="/privacy-policy">
                {tCommon("privacyPolicy")}
              </LocaleLink>
            ),
          })}
        </p>

        <h2>{t("sections.whatSharplyIs.title")}</h2>
        <p>{t("sections.whatSharplyIs.body")}</p>

        <h2>{t("sections.account.title")}</h2>
        <ul>
          <li>{t("sections.account.item1")}</li>
          <li>{t("sections.account.item2")}</li>
          <li>{t("sections.account.item3")}</li>
        </ul>

        <h2>{t("sections.userContent.title")}</h2>
        <p>{t("sections.userContent.body1")}</p>
        <p>{t("sections.userContent.body2")}</p>
        <p>{t("sections.userContent.body3")}</p>

        <h2>{t("sections.prohibited.title")}</h2>
        <ul>
          <li>{t("sections.prohibited.item1")}</li>
          <li>{t("sections.prohibited.item2")}</li>
          <li>{t("sections.prohibited.item3")}</li>
          <li>{t("sections.prohibited.item4")}</li>
          <li>{t("sections.prohibited.item5")}</li>
          <li>{t("sections.prohibited.item6")}</li>
        </ul>

        <h2>{t("sections.intellectualProperty.title")}</h2>
        <p>{t("sections.intellectualProperty.body")}</p>

        <h2>{t("sections.informationAccuracy.title")}</h2>
        <p>{t("sections.informationAccuracy.body")}</p>

        <h2>{t("sections.thirdPartyLinks.title")}</h2>
        <p>{t("sections.thirdPartyLinks.body")}</p>

        <h2>{t("sections.disclaimers.title")}</h2>
        <p>{t("sections.disclaimers.body")}</p>

        <h2>{t("sections.limitationOfLiability.title")}</h2>
        <p>{t("sections.limitationOfLiability.body")}</p>

        <h2>{t("sections.indemnification.title")}</h2>
        <p>{t("sections.indemnification.body")}</p>

        <h2>{t("sections.changes.title")}</h2>
        <p>{t("sections.changes.body")}</p>

        <h2>{t("sections.termination.title")}</h2>
        <p>{t("sections.termination.body")}</p>

        <h2>{t("sections.contact.title")}</h2>
        <p>
          {t.rich("sections.contact.body", {
            privacyPolicy: () => (
              <LocaleLink href="/privacy-policy">
                {tCommon("privacyPolicy")}
              </LocaleLink>
            ),
          })}
        </p>
      </article>
      <ScrollProgress bottomOffset={300} />
    </div>
  );
}
