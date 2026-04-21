import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "~/auth";
import { LocaleLink } from "~/components/locale-link";
import { ProfilePictureSettingsSection } from "~/components/profile/profile-picture-settings-section";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";
import { fetchLinkedAccountsForUser } from "~/server/auth/account-linking";
import type { SocialLink } from "~/server/users/service";
import { AccountLinksSection } from "./account-links-section";
import { DisplayNameForm } from "./display-name-form";
import { PasskeySection } from "./passkey-section";
import { SocialLinksForm } from "./social-links-form";
import { UserHandleForm } from "./user-handle-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profileSettings" });

  return buildLocalizedMetadata("/profile/settings", {
    title: t("metaTitle"),
    openGraph: {
      title: t("metaTitle"),
    },
  });
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profileSettings" });
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  const user = session?.user;

  if (!session) {
    redirect(`/${locale}/auth/signin?callbackUrl=/${locale}/profile/settings`);
  }

  if (!user) {
    redirect(`/${locale}/auth/signin?callbackUrl=/${locale}/profile/settings`);
  }

  const linkedAccounts = await fetchLinkedAccountsForUser(user.id);
  // console.log(linkedAccounts);
  const userEmail = user.email ?? null;

  // Fetch passkeys for display
  const passkeys =
    (await auth.api.listPasskeys({
      headers: requestHeaders,
    })) ?? [];

  const providerAvailability = {
    discord:
      Boolean(process.env.AUTH_DISCORD_ID) &&
      Boolean(process.env.AUTH_DISCORD_SECRET),
    google:
      Boolean(process.env.AUTH_GOOGLE_ID) &&
      Boolean(process.env.AUTH_GOOGLE_SECRET),
  } as const;

  // Parse social links from JSONB
  const socialLinks: SocialLink[] = Array.isArray(user.socialLinks)
    ? (user.socialLinks as SocialLink[])
    : [];

  return (
    <main className="mx-auto min-h-screen max-w-5xl p-6 pt-24">
      <div className="mb-6 space-y-2">
        <LocaleLink
          href={`/u/${user.handle || `user-${user.memberNumber}`}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("viewProfile")}
        </LocaleLink>
        <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
        {userEmail ? (
          <p className="text-muted-foreground text-sm">
            {t("signedInAs", { email: userEmail })}
          </p>
        ) : null}
      </div>

      <div className="space-y-6">
        <section className="border-border space-y-3 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">{t("profilePicture")}</h2>
          <ProfilePictureSettingsSection initialImageUrl={user.image ?? null} />
        </section>

        <section className="border-border space-y-3 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">{t("usernameHandle")}</h2>
          <p className="text-muted-foreground text-sm">
            {t("usernameHandleDescription")}
          </p>
          <UserHandleForm
            key={user.handle ?? `user-${user.memberNumber ?? "unknown"}`}
            initialHandle={user.handle ?? null}
            memberNumber={user.memberNumber}
          />
        </section>

        <section className="border-border space-y-3 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">{t("displayName")}</h2>
          <DisplayNameForm
            key={user.name ?? ""}
            defaultName={user.name ?? ""}
          />
        </section>

        <section className="border-border space-y-3 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">{t("socialLinks")}</h2>
          <p className="text-muted-foreground text-sm">
            {t("socialLinksDescription")}
          </p>
          <SocialLinksForm defaultLinks={socialLinks} />
        </section>

        <Suspense fallback={<section className="rounded-lg border p-4" />}>
          <AccountLinksSection
            linkedAccounts={linkedAccounts}
            providerAvailability={providerAvailability}
            userEmail={userEmail}
          />
        </Suspense>

        <PasskeySection initialPasskeys={passkeys} />
      </div>
    </main>
  );
}
