"use client";

import { useEffect } from "react";
import { actionRecordGearView } from "~/server/popularity/actions";

interface GearVisitTrackerProps {
  slug: string;
}

export function GearVisitTracker({ slug }: GearVisitTrackerProps) {
  const recordVisit = async () => {
    try {
      // Try to include a client-side visitorId to assist the server in dedupe when signed out
      const existing =
        typeof document !== "undefined"
          ? document.cookie
              .split(";")
              .map((c) => c.trim())
              .find((c) => c.startsWith("visitorId="))
              ?.split("=")[1]
          : null;
      const result = await actionRecordGearView({
        slug,
        visitorId: existing ?? null,
      });
      window.dispatchEvent(
        new CustomEvent("gear:view-recorded", {
          detail: {
            slug,
            deduped: result.deduped,
          },
        }),
      );
    } catch (error) {
      console.error("Failed to record visit:", error);
    }
  };

  useEffect(() => {
    // Track visits for everyone; server dedupe handles anonymous via visitorId
    recordVisit().catch((error) => {
      console.error("[GearVisitTracker] error", error);
    });
    // Fire once on mount for a given slug
  }, [slug]);

  // This component doesn't render anything
  return null;
}
