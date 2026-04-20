"use client";

import { useEffect, useMemo } from "react";
import { actionIncrementComparePairCount } from "~/server/popularity/actions";

export function ComparePairTracker({ slugs }: { slugs: string[] }) {
  const pair = useMemo(() => slugs.slice(0, 2).sort(), [slugs]);

  useEffect(() => {
    if (pair.length === 2) {
      actionIncrementComparePairCount({
        slugs: [pair[0]!, pair[1]!],
      }).catch(() => {
        // ignore failures
      });
    }
  }, [pair[0], pair[1]]);

  return null;
}
