import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "~/auth";
import { AddPasskeyClient } from "./passkey-client";

export const metadata: Metadata = {
  title: "Add Passkey",
  openGraph: {
    title: "Add Passkey",
  },
};

export default async function AddPasskeyPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/profile/settings/add-passkey");
  }

  const userEmail = session.user.email ?? undefined;

  return <AddPasskeyClient userEmail={userEmail} />;
}


