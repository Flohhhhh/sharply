import type { Metadata } from "next";
import { auth } from "~/server/auth";
import { fetchFullUserById } from "~/server/users/service";
import UserCard from "./user-card";

export const metadata: Metadata = {
  title: "Welcome!",
};

export default async function WelcomePage() {
  const session = await auth();

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
    <div className="bg-background flex min-h-screen w-full flex-col items-center justify-center gap-12">
      <div className="max-w-lg space-y-3 text-center">
        <h1 className="text-4xl font-bold">Welcome {firstName}!</h1>
        <p className="text-muted-foreground">
          You just joined the community leading photography data into the
          future.
        </p>
      </div>

      <UserCard user={user} />
    </div>
  );
}
