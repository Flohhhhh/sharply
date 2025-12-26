import { auth } from "~/server/auth";
import { fetchFullUserById } from "~/server/users/service";
import { DisplayNameForm } from "./display-name-form";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfilePictureSettingsSection } from "~/components/profile/profile-picture-settings-section";
import { SocialLinksForm } from "./social-links-form";
import type { SocialLink } from "~/server/users/service";

export const metadata: Metadata = {
  title: "Account Settings",
  openGraph: {
    title: "Account Settings",
  },
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/profile/settings");
  }

  const user = await fetchFullUserById(session.user.id);

  // Parse social links from JSONB
  const socialLinks: SocialLink[] = Array.isArray(user?.socialLinks)
    ? (user.socialLinks as SocialLink[])
    : [];

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-6 pt-24">
      <h1 className="mb-6 text-2xl font-bold">Account Settings</h1>

      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Profile Picture</h2>
          <ProfilePictureSettingsSection
            initialImageUrl={user?.image ?? null}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Display Name</h2>
          <DisplayNameForm defaultName={user?.name ?? ""} />
        </section>

        <section className="space-y-4">
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
