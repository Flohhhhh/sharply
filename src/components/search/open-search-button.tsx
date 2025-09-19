"use client";

import * as React from "react";
import { Button, type ButtonProps } from "~/components/ui/button";

export interface OpenSearchButtonProps extends ButtonProps {
  children?: React.ReactNode;
}

export function OpenSearchButton({
  children,
  ...props
}: OpenSearchButtonProps) {
  return (
    <Button
      {...props}
      onClick={(e) => {
        props.onClick?.(e);
        try {
          document.dispatchEvent(
            new CustomEvent("sharply:open-command-palette"),
          );
        } catch {}
      }}
    >
      {children ?? "Open search"}
    </Button>
  );
}
