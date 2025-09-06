"use client";

import { Button } from "~/components/ui/button";
import { BADGE_CATALOG } from "~/lib/badges/catalog";
import { showBadgeToast } from "~/components/badges/badge-toast";

export function BadgesTestToastButton() {
  function handleClick() {
    const sample = BADGE_CATALOG[0];

    if (!sample) return;
    showBadgeToast(sample);
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      className="w-full sm:w-auto"
    >
      Send Test Badge Toast
    </Button>
  );
}
