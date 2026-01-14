"use client";

import { useEffect, useState } from "react";
import { useSession } from "~/lib/auth/auth-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { Trash, Plus, ListTree } from "lucide-react";
import { requireRole } from "~/lib/auth/auth-helpers";
import {
  GearSearchCombobox,
  type GearOption,
} from "~/components/gear/gear-search-combobox";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";

interface GearAlternative {
  gearId: string;
  alternativeGearId: string;
  isDirectCompetitor: boolean;
  alternativeName: string;
  alternativeSlug: string;
  alternativeThumbnailUrl: string | null;
  alternativeBrandId: string;
}

export interface GearAlternativesModalProps {
  gearId: string;
  gearName: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function GearAlternativesModal(props: GearAlternativesModalProps) {
  const { data, isPending, error } = useSession();

  const [open, setOpen] = useState(false);
  const [alternatives, setAlternatives] = useState<GearAlternative[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedGear, setSelectedGear] = useState<GearOption | null>(null);
  const [isCompetitor, setIsCompetitor] = useState(false);

  // Fetch alternatives when modal opens
  useEffect(() => {
    if (open && props.gearId) {
      fetchAlternatives();
    }
  }, [open, props.gearId]);

  const fetchAlternatives = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/gear/${props.gearId}/alternatives`);
      if (!res.ok) {
        throw new Error("Failed to fetch alternatives");
      }
      const data = await res.json();
      setAlternatives(data.alternatives || []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to fetch alternatives",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAlternative = async () => {
    if (!selectedGear) {
      toast.error("Please select a gear item");
      return;
    }

    // Check if already exists
    if (
      alternatives.some((a) => a.alternativeGearId === selectedGear.id)
    ) {
      toast.error("This alternative already exists");
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch(`/api/admin/gear/${props.gearId}/alternatives`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alternativeGearId: selectedGear.id,
          isDirectCompetitor: isCompetitor,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add alternative");
      }

      toast.success("Alternative added successfully");
      setSelectedGear(null);
      setIsCompetitor(false);
      await fetchAlternatives();
      props.onSuccess?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add alternative",
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveAlternative = async (alternativeGearId: string) => {
    try {
      const res = await fetch(`/api/admin/gear/${props.gearId}/alternatives`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alternativeGearId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to remove alternative");
      }

      toast.success("Alternative removed successfully");
      await fetchAlternatives();
      props.onSuccess?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove alternative",
      );
    }
  };

  const handleToggleCompetitor = async (
    alternativeGearId: string,
    currentValue: boolean,
  ) => {
    try {
      const res = await fetch(`/api/admin/gear/${props.gearId}/alternatives`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alternativeGearId,
          isDirectCompetitor: !currentValue,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update alternative");
      }

      toast.success("Alternative updated successfully");
      await fetchAlternatives();
      props.onSuccess?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update alternative",
      );
    }
  };

  if (isPending) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  if (!data) {
    return <div>Unauthenticated</div>;
  }
  const session = data.session;
  const user = data.user;

  if (!session) return null;

  const access = requireRole(user, ["EDITOR"]);

  if (!access) return null;

  const handleOpenChange = (next: boolean) => {
    if (next && !access) {
      toast.error("You must be an editor to manage gear alternatives.");
      setOpen(false);
      return;
    }
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {props.trigger ?? (
          <Button icon={<ListTree className="h-4 w-4" />} variant="outline">
            Manage Alternatives
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Gear Alternatives</DialogTitle>
          <DialogDescription>
            Add alternative gear items for {props.gearName}. Mark direct
            competitors separately from adjacent alternatives.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new alternative section */}
          <div className="space-y-3 rounded-lg border p-4">
            <h3 className="text-sm font-medium">Add Alternative</h3>
            <div className="space-y-3">
              <GearSearchCombobox
                value={selectedGear}
                setValue={setSelectedGear}
                placeholder="Search for gear"
                searchPlaceholder="Search gear..."
                emptyText="No gear found"
                limit={10}
                minChars={2}
                allowClear
                fullWidth
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-competitor"
                  checked={isCompetitor}
                  onCheckedChange={(checked) =>
                    setIsCompetitor(checked === true)
                  }
                />
                <Label
                  htmlFor="is-competitor"
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Direct Competitor
                </Label>
              </div>
              <Button
                onClick={handleAddAlternative}
                disabled={!selectedGear || isAdding}
                loading={isAdding}
                icon={<Plus className="h-4 w-4" />}
                className="w-full"
              >
                Add Alternative
              </Button>
            </div>
          </div>

          {/* List of current alternatives */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">
              Current Alternatives ({alternatives.length})
            </h3>
            {isLoading ? (
              <div className="text-muted-foreground py-8 text-center text-sm">
                Loading alternatives...
              </div>
            ) : alternatives.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center text-sm">
                No alternatives added yet
              </div>
            ) : (
              <div className="space-y-2">
                {alternatives.map((alt) => (
                  <div
                    key={alt.alternativeGearId}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center space-x-3">
                      {alt.alternativeThumbnailUrl && (
                        <img
                          src={alt.alternativeThumbnailUrl}
                          alt={alt.alternativeName}
                          className="h-10 w-10 rounded object-contain"
                        />
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {alt.alternativeName}
                        </span>
                        {alt.isDirectCompetitor && (
                          <span className="text-xs text-orange-600 dark:text-orange-400">
                            Direct Competitor
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`competitor-${alt.alternativeGearId}`}
                        checked={alt.isDirectCompetitor}
                        onCheckedChange={() =>
                          handleToggleCompetitor(
                            alt.alternativeGearId,
                            alt.isDirectCompetitor,
                          )
                        }
                        title="Mark as direct competitor"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Trash className="h-4 w-4" />}
                        onClick={() =>
                          handleRemoveAlternative(alt.alternativeGearId)
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default GearAlternativesModal;
