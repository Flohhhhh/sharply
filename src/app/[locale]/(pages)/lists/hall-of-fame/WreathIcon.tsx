"use client";

import { useTheme } from "next-themes";
import * as React from "react";
import { TbLaurelWreath } from "react-icons/tb";

type WreathIconProps = {
  className?: string;
};

export function WreathIcon({ className }: WreathIconProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  return (
    <TbLaurelWreath
      strokeWidth={isDark ? 1 : 1.5}
      className={className}
    />
  );
}


