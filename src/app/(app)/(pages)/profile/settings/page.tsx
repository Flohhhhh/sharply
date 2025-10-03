import { auth } from "~/server/auth";
import { fetchFullUserById } from "~/server/users/service";
import { SettingsForm } from "./settings-form";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

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

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-6 pt-24">
      <h1 className="mb-6 text-2xl font-bold">Account Settings</h1>
      <SettingsForm defaultName={user?.name ?? ""} />
    </main>
  );
}
