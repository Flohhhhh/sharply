import HeaderClient, { type HeaderUser } from "./header-client";
import { auth } from "~/auth";
import { headers } from "next/headers";
import { fetchNotificationsForUser } from "~/server/notifications/service";

export default async function Header() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const user: HeaderUser = session?.user
    ? {
        id: session.user.id,
        role: session.user.role,
        handle: session.user.handle,
        memberNumber: session.user.memberNumber,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }
    : null;

  const notifications = user
    ? await fetchNotificationsForUser({
        userId: user.id,
        limit: 10,
        archivedLimit: 5,
      })
    : null;

  return <HeaderClient user={user} notifications={notifications} />;
}
