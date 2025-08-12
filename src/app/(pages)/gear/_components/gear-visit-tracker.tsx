"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

interface GearVisitTrackerProps {
  slug: string;
}

export function GearVisitTracker({ slug }: GearVisitTrackerProps) {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Only track visits for authenticated users
    if (status === "authenticated" && session?.user) {
      recordVisit();
    }
  }, [status, session, slug]);

  const recordVisit = async () => {
    try {
      await fetch(`/api/gear/${slug}/visit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // Silently fail - we don't want to break the user experience
      console.error("Failed to record visit:", error);
    }
  };

  // This component doesn't render anything
  return null;
}
