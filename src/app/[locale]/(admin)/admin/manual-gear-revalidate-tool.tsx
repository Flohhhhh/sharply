"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import GearCombobox, {
  type GearSuggestion,
} from "~/components/custom-inputs/gear-combobox";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { actionRevalidateGearPage } from "~/server/admin/tools/actions";

export function ManualGearRevalidateTool() {
  const [selectedGear, setSelectedGear] = useState<GearSuggestion | null>(null);
  const [isPending, startTransition] = useTransition();
  const [lastPath, setLastPath] = useState<string | null>(null);

  const handleRevalidate = () => {
    if (!selectedGear?.slug) {
      toast.error("Select a gear item first.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await actionRevalidateGearPage({
          gearSlug: selectedGear.slug,
        });
        setLastPath(result.path);
        toast.success(`Revalidated ${result.path}`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to revalidate page";
        toast.error(message);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Gear Page Revalidation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Select a gear item and manually revalidate its public gear page.
        </p>

        <GearCombobox
          name="gearRevalidateId"
          placeholder="Search gear..."
          onlyLenses={false}
          onSelectedChange={setSelectedGear}
        />

        {selectedGear ? (
          <div className="text-muted-foreground text-sm">
            Selected:{" "}
            <Link
              href={`/gear/${selectedGear.slug}`}
              className="text-primary underline"
            >
              {selectedGear.name}
            </Link>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleRevalidate}
            disabled={isPending || !selectedGear?.slug}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`}
            />
            {isPending ? "Revalidating..." : "Revalidate Page"}
          </Button>
          {lastPath ? (
            <span className="text-muted-foreground text-xs">
              Last revalidated: {lastPath}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
