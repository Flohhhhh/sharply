"use client";

import { Suspense } from "react";
import useSWR from "swr";
import { useSession } from "~/lib/auth/auth-client";
import { fetchJson } from "~/lib/fetch-json";
import HeaderClient,{
  type HeaderNotificationsData,
  type HeaderUser,
} from "./header-client";

export default function Header() {
  const { data: sessionData } = useSession();

  const user: HeaderUser = sessionData?.user
    ? {
        id: sessionData.user.id,
        role: sessionData.user.role,
        handle: sessionData.user.handle,
        memberNumber: sessionData.user.memberNumber,
        name: sessionData.user.name,
        email: sessionData.user.email,
        image: sessionData.user.image,
      }
    : null;
  const { data: notificationsData } = useSWR<HeaderNotificationsData>(
    user?.id ? "/api/notifications/header" : null,
    (url: string) =>
      fetchJson<HeaderNotificationsData>(url, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      }),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      shouldRetryOnError: false,
    },
  );
  const notifications = user?.id ? (notificationsData ?? null) : null;

  return (
    <Suspense
      fallback={
        <div className="bg-background fixed top-0 right-0 left-0 z-50 h-16" />
      }
    >
      <HeaderClient user={user} notifications={notifications} />
    </Suspense>
  );
}
