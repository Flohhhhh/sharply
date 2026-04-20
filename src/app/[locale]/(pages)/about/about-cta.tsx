"use client";

import { Search, UserPlus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { LocaleLink } from "~/components/locale-link";
import { useSession } from "~/lib/auth/auth-client";

export function AboutCta() {
  const { data: session } = useSession();

  if (session) {
    return (
      <Button
        asChild
        icon={<Search className="size-4" />}
        iconPosition="right"
        className="mt-4"
      >
        <LocaleLink href="/gear">Browse gear</LocaleLink>
      </Button>
    );
  }

  return (
    <Button
      asChild
      icon={<UserPlus className="size-4" />}
      iconPosition="right"
      className="mt-4"
    >
      <LocaleLink href="/auth/signup">Create an account</LocaleLink>
    </Button>
  );
}
