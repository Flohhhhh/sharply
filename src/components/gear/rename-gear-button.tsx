"use client";

import { useSession } from "next-auth/react";
import { RenameGearDialog } from "~/components/gear/rename-gear-dialog";
import { Button } from "~/components/ui/button";
import { Pencil } from "lucide-react";
import type { SessionRole } from "~/server/auth";

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
  const { data: session } = useSession();
  const role = (session?.user as { role?: SessionRole } | null | undefined)
    ?.role;
  const isAdminOrEditor =
    role === "ADMIN" || role === "SUPERADMIN" || role === "EDITOR";

  if (!isAdminOrEditor) return null;

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
