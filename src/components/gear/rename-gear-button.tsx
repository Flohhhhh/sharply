"use client";

import { useSession } from "~/lib/auth/auth-client";
import { RenameGearDialog } from "~/components/gear/rename-gear-dialog";
import { Button } from "~/components/ui/button";
import { Pencil } from "lucide-react";
import { requireRole } from "~/lib/auth/auth-helpers";

interface RenameGearButtonProps {
  gearId: string;
  currentName: string;
  currentSlug: string;
}

export function RenameGearButton({
  gearId,
  currentName,
  currentSlug,
}: RenameGearButtonProps) {
  const { data } = useSession();

  const session = data?.session;
  const user = data?.user;

  if (!session || !user || !requireRole(user, ["EDITOR"])) return null;

  return (
    <RenameGearDialog
      gearId={gearId}
      currentName={currentName}
      currentSlug={currentSlug}
      trigger={
        <Button variant="ghost" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
      }
    />
  );
}
