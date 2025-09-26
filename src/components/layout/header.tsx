import HeaderClient, { type HeaderUser } from "./header-client";
import { auth } from "~/server/auth";

export default async function Header() {
  const session = await auth();
  const user: HeaderUser = session?.user
    ? {
        id: session.user.id,
        role: session.user.role,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }
    : null;
  return <HeaderClient user={user} />;
}
