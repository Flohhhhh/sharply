"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { actionRecordGearView } from "~/server/popularity/actions";

interface GearVisitTrackerProps {
  slug: string;
}

export function GearVisitTracker({ slug }: GearVisitTrackerProps) {
  const { data: session, status } = useSession();

  const recordVisit = async () => {
    try {
      await actionRecordGearView({ slug });
    } catch (error) {
      console.error("Failed to record visit:", error);
    }
  };

  useEffect(() => {
    // Only track visits for authenticated users
    if (status === "authenticated" && session?.user) {
      recordVisit().catch((error) => {
        console.error("[GearVisitTracker] error", error);
      });
    }
  }, [status, session, slug]);

  // This component doesn't render anything
  return null;
}
