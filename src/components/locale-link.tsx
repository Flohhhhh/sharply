"use client";

import Link, { type LinkProps } from "next/link";
import { useLocale } from "next-intl";
import * as React from "react";
import type { Locale } from "~/i18n/config";
import { localizeHref } from "~/i18n/routing";

type LocaleLinkProps = React.ComponentProps<typeof Link>;

export const LocaleLink = React.forwardRef<HTMLAnchorElement, LocaleLinkProps>(
  function LocaleLink({ href, ...props }, ref) {
    const locale = useLocale() as Locale;

    return (
      <Link
        ref={ref}
        href={localizeHref(href as LinkProps["href"], locale)}
        {...props}
      />
    );
  },
);
