"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Progress } from "~/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import EditModalContent from "~/app/(app)/(pages)/gear/_components/edit-gear/edit-modal-content";
import type { GearItem } from "~/types/gear";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Loader2 } from "lucide-react";

type Row = {
  id: string;
  slug: string;
  name: string;
  brandName: string | null;
  gearType: string;
  missingCount: number;
  missing: string[];
  completionPercent: number;
  createdAt: string | Date;
  underConstruction: boolean;
};

export function UnderConstructionTable({ items }: { items: Row[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<{
    slug: string;
    type: "CAMERA" | "LENS";
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [gearData, setGearData] = useState<GearItem | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);
  const [showMissingOnly, setShowMissingOnly] = useState(true);

  const requestClose = useCallback(
    (opts?: { force?: boolean }) => {
      if (isDirty && !opts?.force) {
        setConfirmExitOpen(true);
        return;
      }
      setOpen(false);
      setIsDirty(false);
    },
    [isDirty],
  );

  const handleOpen = useCallback((slug: string, type: "CAMERA" | "LENS") => {
    setSelected({ slug, type });
    setIsDirty(false);
    setShowMissingOnly(true); // default to missing-only when launched from this page
    setOpen(true);
  }, []);

  useEffect(() => {
    let aborted = false;
    async function load() {
      if (!open || !selected) return;
      setLoading(true);
      // Reset dirty when loading a fresh item/session
      setIsDirty(false);
      try {
        const res = await fetch(`/api/gear/${selected.slug}/edit-data`, {
          method: "GET",
        });
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const data = (await res.json()) as GearItem;
        if (!aborted) setGearData(data);
      } catch (err) {
        console.error("[UnderConstructionTable] fetch edit-data error", err);
        if (!aborted) setGearData(null);
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    void load();
    return () => {
      aborted = true;
    };
  }, [open, selected]);

  const rows = useMemo(() => items, [items]);

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Missing</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((it, idx) => {
              const editHref = `/gear/${it.slug}/edit?type=${it.gearType}`;
              return (
                <TableRow
                  key={it.id}
                  className={`cursor-pointer overflow-visible ${idx % 2 === 0 ? "hover:bg-accent/25" : "hover:bg-accent/60"}`}
                  onClick={() =>
                    handleOpen(it.slug, it.gearType as "CAMERA" | "LENS")
                  }
                  role="button"
                >
                  <TableCell className="max-w-[360px]">
                    <div className="flex items-center gap-2">
                      <span className="font-medium underline-offset-2 group-hover:underline">
                        {it.name}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {it.brandName ?? ""}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap uppercase">
                    {it.gearType}
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex flex-wrap gap-1">
                      {it.missing.slice(0, 6).map((m) => (
                        <Badge key={m} variant="outline" className="text-xs">
                          {m}
                        </Badge>
                      ))}
                      {it.missing.length > 6 ? (
                        <Badge variant="outline" className="text-xs">
                          +{it.missing.length - 6} more
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="w-[240px]">
                    <div className="flex items-center gap-2">
                      <Progress value={it.completionPercent} className="h-2" />
                      <span className="text-muted-foreground w-10 text-right text-xs">
                        {it.completionPercent}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {it.underConstruction ? (
                      <Badge variant="destructive">Under construction</Badge>
                    ) : (
                      <Badge variant="secondary">Low completeness</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) requestClose();
          else setOpen(true);
        }}
      >
        <DialogContent className="p-0 sm:max-w-4xl">
          <div className="flex max-h-[90vh] flex-col">
            {selected && !loading && gearData && (
              <EditModalContent
                gearType={selected.type as any}
                gearSlug={selected.slug}
                gearData={gearData}
                onDirtyChange={setIsDirty}
                onRequestClose={requestClose}
                initialShowMissingOnly={showMissingOnly}
                formId="edit-gear-form"
              />
            )}
            {selected && loading && (
              <div className="flex max-h-[90vh] flex-col">
                <div className="px-6 pt-6 pb-4">
                  <DialogHeader>
                    <DialogTitle>Edit {selected?.slug}</DialogTitle>
                  </DialogHeader>
                </div>
                <div className="flex min-h-[400px] flex-1 items-center justify-center p-6">
                  <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                  <span className="text-muted-foreground ml-2 text-sm">
                    Loading…
                  </span>
                </div>
                <div className="bg-background border-t px-6 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="uc-loading-missing-only">
                        Show missing only
                      </Label>
                      <Switch
                        id="uc-loading-missing-only"
                        checked={showMissingOnly}
                        onCheckedChange={setShowMissingOnly}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md border px-4 text-sm"
                        onClick={() => requestClose()}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled
                        className="bg-primary text-primary-foreground/60 h-9 cursor-not-allowed rounded-md px-4 text-sm"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmExitOpen} onOpenChange={setConfirmExitOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. If you exit now, your edits will be
              lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmExitOpen(false)}>
              Stay
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmExitOpen(false);
                requestClose({ force: true });
              }}
            >
              Discard & Exit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default UnderConstructionTable;
