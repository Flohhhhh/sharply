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
      await actionRecordGearView({ slug, visitorId: existing ?? null });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // This component doesn't render anything
  return null;
}
