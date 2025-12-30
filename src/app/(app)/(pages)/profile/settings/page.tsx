import { auth } from "~/auth";
import type { Passkey } from "@better-auth/passkey";
import { DisplayNameForm } from "./display-name-form";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfilePictureSettingsSection } from "~/components/profile/profile-picture-settings-section";
import { AccountLinksSection } from "./account-links-section";
import { SocialLinksForm } from "./social-links-form";
import type { SocialLink } from "~/server/users/service";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { fetchLinkedAccountsForUser } from "~/server/auth/account-linking";
import { headers } from "next/headers";
import { PasskeySection } from "./passkey-section";

export const metadata: Metadata = {
  title: "Account Settings",
  openGraph: {
    title: "Account Settings",
  },
};

export default async function SettingsPage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  const user = session?.user;

  if (!session) {
    redirect("/auth/signin?callbackUrl=/profile/settings");
  }

  if (!user) {
    redirect("/auth/signin?callbackUrl=/profile/settings");
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
    <main className="mx-auto min-h-screen max-w-3xl p-6 pt-24">
      <div className="mb-6 space-y-2">
        <Link
          href={`/u/${user.id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          View profile
        </Link>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        {userEmail ? (
          <p className="text-muted-foreground text-sm">
            Signed in as {userEmail}
          </p>
        ) : null}
      </div>

      <div className="space-y-6">
        <section className="border-border space-y-3 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Profile Picture</h2>
          <ProfilePictureSettingsSection initialImageUrl={user.image ?? null} />
        </section>

        <section className="border-border space-y-3 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Display Name</h2>
          <DisplayNameForm defaultName={user.name ?? ""} />
        </section>

        <AccountLinksSection
          linkedAccounts={linkedAccounts}
          providerAvailability={providerAvailability}
          userEmail={userEmail}
        />

        <PasskeySection initialPasskeys={passkeys} />

        <section className="border-border space-y-3 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Social Links</h2>
          <p className="text-muted-foreground text-sm">
            Add links to your social media profiles and personal website. These
            will be displayed on your public profile.
          </p>
          <SocialLinksForm defaultLinks={socialLinks} />
        </section>
      </div>
    </main>
  );
}
