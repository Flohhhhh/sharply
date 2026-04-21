"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { Button,type ButtonProps } from "~/components/ui/button";
import { dispatchOpenSearchSurface } from "./search-events";

export interface OpenSearchButtonProps extends ButtonProps {
  children?: React.ReactNode;
}

export function OpenSearchButton({
  children,
  ...props
}: OpenSearchButtonProps) {
  const t = useTranslations("search");
  return (
    <Button
      {...props}
      onClick={(e) => {
        props.onClick?.(e);
        dispatchOpenSearchSurface();
      }}
      >
      {children ?? t("openSearch")}
    </Button>
  );
}
