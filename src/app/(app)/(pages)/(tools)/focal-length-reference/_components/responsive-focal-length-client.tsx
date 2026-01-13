"use client";

import { useEffect, useState } from "react";

import { FocalLengthClient } from "./focal-length-client";
import { FocalLengthClientMobile } from "./focal-length-client-mobile";
import { useIsMobile } from "~/hooks/use-mobile";

const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";

export function ResponsiveFocalLengthClient() {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <FocalLengthClient />;
  }

  return <FocalLengthClientMobile />;
}
