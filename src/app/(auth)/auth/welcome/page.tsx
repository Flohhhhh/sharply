import type { Metadata } from "next";
import { auth } from "~/server/auth";
import { fetchFullUserById } from "~/server/users/service";
import UserCard from "./user-card";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Welcome!",
};

export default async function WelcomePage(props: {
  searchParams: {
    callbackUrl?: string;
  };
}) {
  const session = await auth();
  const searchParams = props.searchParams;
  const redirectUrl = searchParams.callbackUrl;

  if (!session?.user?.id) {
    return (
      <div className="bg-background flex min-h-screen w-full flex-col items-center justify-center">
        <p>Please sign in to continue.</p>
      </div>
    );
  }

  // Fetch the full user data from the database
  const user = await fetchFullUserById(session.user.id);

  if (!user) {
    return (
      <div className="bg-background flex min-h-screen w-full flex-col items-center justify-center">
        <p>User not found.</p>
      </div>
    );
  }

  const firstName = user.name?.split(" ")[0];

  return (
    <div className="bg-background flex min-h-screen w-full flex-col items-center justify-center gap-8 px-4 sm:px-8">
      <div className="max-w-xl space-y-3 text-center">
        <h1 className="text-4xl font-bold">Welcome {firstName}!</h1>
        <p className="text-muted-foreground">
          You just joined the community leading photography data into the
          future.
        </p>
      </div>

      <UserCard user={user} />

      <Button
        asChild
        variant="ghost"
        icon={<ArrowRight />}
        iconPosition="right"
      >
        <Link href={redirectUrl ?? "/"}>Continue to Sharply</Link>
      </Button>
    </div>
  );
}
