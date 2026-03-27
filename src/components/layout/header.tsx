"use client";

import { Suspense, useEffect, useState } from "react";
import HeaderClient, {
  type HeaderNotificationsData,
  type HeaderUser,
} from "./header-client";
import { useSession } from "~/lib/auth/auth-client";

export default function Header() {
  const { data: sessionData } = useSession();
  const [notifications, setNotifications] =
    useState<HeaderNotificationsData>(null);

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

  useEffect(() => {
    if (!user?.id) {
      setNotifications(null);
      return;
    }

    let isCancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/notifications/header", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as HeaderNotificationsData;
        if (!isCancelled) {
          setNotifications(payload);
        }
      } catch {
        // Keep the header usable if notifications fail to load.
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [user?.id]);

  return (
    <Suspense fallback={<div className="bg-background fixed top-0 right-0 left-0 z-50 h-16" />}>
      <HeaderClient user={user} notifications={notifications} />
    </Suspense>
  );
}
