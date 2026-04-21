import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "~/auth";
import { AddPasskeyClient } from "./passkey-client";
import { getTranslations } from "next-intl/server";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profileSettings" });

  return buildLocalizedMetadata("/profile/settings/add-passkey", {
    title: t("addPasskey"),
    openGraph: {
      title: t("addPasskey"),
    },
  });
}

export default async function AddPasskeyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect(
      `/${locale}/auth/signin?callbackUrl=/${locale}/profile/settings/add-passkey`,
    );
  }

  const userEmail = session.user.email ?? undefined;

  return <AddPasskeyClient userEmail={userEmail} />;
}
