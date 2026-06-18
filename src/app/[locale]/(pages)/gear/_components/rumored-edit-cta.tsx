"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { useSession } from "~/lib/auth/auth-client";
import { requireRole } from "~/lib/auth/auth-helpers";

export function RumoredEditCta(props: { slug: string; label: string }) {
  const { slug, label } = props;
  const { data } = useSession();

  if (!requireRole(data?.user, ["EDITOR", "ADMIN", "SUPERADMIN"])) {
    return null;
  }

  return (
    <Button asChild size="sm" icon={<Pencil className="size-4" />}>
      <Link href={`/gear/${slug}/edit`} scroll={false}>
        {label}
      </Link>
    </Button>
  );
}
