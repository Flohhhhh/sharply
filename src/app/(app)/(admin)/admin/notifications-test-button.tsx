"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { actionSendTestNotification } from "~/server/notifications/actions";

export function NotificationsTestButton() {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      try {
        const res = await actionSendTestNotification();
        toast.success(
          res.type === "gear_spec_approved"
            ? "Sent gear approval test notification"
            : "Sent badge test notification",
          {
            description: res.linkUrl ? `Link: ${res.linkUrl}` : undefined,
          },
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to send test notification");
      }
    });
  };

  return (
    <Button onClick={handleClick} disabled={isPending}>
      {isPending ? "Sending..." : "Send test notification"}
    </Button>
  );
}

