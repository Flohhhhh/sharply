"use client";

import { FocalLengthClient } from "./focal-length-client";
import { FocalLengthClientMobile } from "./focal-length-client-mobile";
import { useIsMobile } from "~/hooks/use-mobile";

export function ResponsiveFocalLengthClient() {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <FocalLengthClient />;
  }

  return <FocalLengthClientMobile />;
}
