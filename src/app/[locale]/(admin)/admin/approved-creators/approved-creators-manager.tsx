"use client";

import { Edit,Plus,Search,UserRoundCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo,useState,useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card,CardContent,CardHeader,CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import {
  actionCreateApprovedCreator,
  actionSetApprovedCreatorActive,
  actionUpdateApprovedCreator,
} from "~/server/admin/approved-creators/actions";
import type { ApprovedCreatorRow } from "~/server/admin/approved-creators/service";

type ApprovedCreatorsManagerProps = {
  initialCreators: ApprovedCreatorRow[];
};

type CreatorFormState = {
  name: string;
  platform: "YOUTUBE";
  channelUrl: string;
  avatarUrl: string;
  internalNotes: string;
  isActive: boolean;
};

const emptyFormState: CreatorFormState = {
  name: "",
  platform: "YOUTUBE",
  channelUrl: "",
  avatarUrl: "",
  internalNotes: "",
  isActive: true,
};

function toFormState(creator?: ApprovedCreatorRow | null): CreatorFormState {
  if (!creator) {
    return emptyFormState;
  }

  return {
    name: creator.name,
    platform: creator.platform,
    channelUrl: creator.channelUrl,
    avatarUrl: creator.avatarUrl ?? "",
    internalNotes: creator.internalNotes ?? "",
    isActive: creator.isActive,
  };
}

export function ApprovedCreatorsManager({
  initialCreators,
}: ApprovedCreatorsManagerProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCreator, setEditingCreator] = useState<ApprovedCreatorRow | null>(
    null,
  );
  const [formState, setFormState] = useState<CreatorFormState>(emptyFormState);
  const [isPending, startTransition] = useTransition();

  const filteredCreators = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return initialCreators;
    }

    return initialCreators.filter((creator) => {
      return (
        creator.name.toLowerCase().includes(normalized) ||
        creator.channelUrl.toLowerCase().includes(normalized) ||
        (creator.internalNotes ?? "").toLowerCase().includes(normalized)
      );
    });
  }, [initialCreators, query]);

  function openCreateDialog() {
    setEditingCreator(null);
    setFormState(emptyFormState);
    setDialogOpen(true);
  }

  function openEditDialog(creator: ApprovedCreatorRow) {
    setEditingCreator(creator);
    setFormState(toFormState(creator));
    setDialogOpen(true);
  }

  function handleSubmit() {
    startTransition(async () => {
      try {
        if (editingCreator) {
          await actionUpdateApprovedCreator(editingCreator.id, formState);
          toast.success("Creator updated");
        } else {
          await actionCreateApprovedCreator(formState);
          toast.success("Creator added");
        }
        setDialogOpen(false);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save creator",
        );
      }
    });
  }

  function handleToggleActive(creator: ApprovedCreatorRow) {
    startTransition(async () => {
      try {
        await actionSetApprovedCreatorActive(creator.id, !creator.isActive);
        toast.success(
          creator.isActive ? "Creator deactivated" : "Creator reactivated",
        );
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update creator",
        );
      }
    });
  }

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Allowlist</CardTitle>
          <p className="text-muted-foreground text-sm">
            Only active creators in this list can be selected from gear pages.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-[260px]">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search creators"
              className="pl-9"
            />
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" onClick={openCreateDialog}>
                <Plus className="size-4" />
                Add Creator
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingCreator ? "Edit Approved Creator" : "Add Approved Creator"}
                </DialogTitle>
                <DialogDescription>
                  Editors can only attach videos from active approved creators.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="creator-name">Name</Label>
                    <Input
                      id="creator-name"
                      value={formState.name}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Creator name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="creator-platform">Platform</Label>
                    <Input id="creator-platform" value={formState.platform} disabled />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creator-channel-url">Channel URL</Label>
                  <Input
                    id="creator-channel-url"
                    value={formState.channelUrl}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        channelUrl: event.target.value,
                      }))
                    }
                    placeholder="https://www.youtube.com/@creator"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creator-avatar-url">Avatar URL</Label>
                  <Input
                    id="creator-avatar-url"
                    value={formState.avatarUrl}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        avatarUrl: event.target.value,
                      }))
                    }
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creator-notes">Internal Notes</Label>
                  <Textarea
                    id="creator-notes"
                    value={formState.internalNotes}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        internalNotes: event.target.value,
                      }))
                    }
                    rows={4}
                    placeholder="Optional editorial notes"
                  />
                </div>

                <div className="flex items-center gap-3 rounded-md border px-4 py-3">
                  <Checkbox
                    id="creator-active"
                    checked={formState.isActive}
                    onCheckedChange={(checked) =>
                      setFormState((current) => ({
                        ...current,
                        isActive: checked === true,
                      }))
                    }
                  />
                  <Label htmlFor="creator-active">Active and selectable</Label>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={handleSubmit} disabled={isPending}>
                  {isPending ? "Saving..." : editingCreator ? "Save Changes" : "Add Creator"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creator</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCreators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    <div className="text-muted-foreground flex flex-col items-center gap-2 text-sm">
                      <UserRoundCheck className="size-5" />
                      No creators match the current search.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCreators.map((creator) => (
                  <TableRow key={creator.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{creator.name}</div>
                        {creator.internalNotes ? (
                          <div className="text-muted-foreground line-clamp-2 text-xs">
                            {creator.internalNotes}
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{creator.platform}</TableCell>
                    <TableCell className="max-w-[280px]">
                      <a
                        href={creator.channelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary block truncate text-sm hover:underline"
                      >
                        {creator.channelUrl}
                      </a>
                    </TableCell>
                    <TableCell>{creator.activeVideoCount}</TableCell>
                    <TableCell>
                      <Badge variant={creator.isActive ? "default" : "secondary"}>
                        {creator.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(creator)}
                          disabled={isPending}
                        >
                          <Edit className="size-4" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={creator.isActive ? "outline" : "default"}
                          onClick={() => handleToggleActive(creator)}
                          disabled={isPending}
                        >
                          {creator.isActive ? "Deactivate" : "Reactivate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
