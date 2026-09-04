"use client";

import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import EditModalContent from "~/app/[locale]/(pages)/gear/_components/edit-gear/edit-modal-content";
import {
  handleGearEditSubmissionSuccess,
  type GearEditSubmissionSuccess,
} from "~/app/[locale]/(pages)/gear/_components/edit-gear/edit-gear-navigation";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import type { Locale } from "~/i18n/config";
import { localizePathname } from "~/i18n/routing";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useUnsavedChangesGuard } from "~/lib/hooks/useUnsavedChangesGuard";
import type { GearItem, GearType } from "~/types/gear";
import {
  UnderConstructionRow,
  type UnderConstructionRowData,
} from "./under-construction-row";
import { buildGearEditDataUrl } from "./under-construction-row-actions";

const GearImageModal = dynamic(
  () =>
    import("~/components/modals/gear-image-modal").then(
      (mod) => mod.GearImageModal,
    ),
  { ssr: false },
);

async function fetchGearEditData(url: string): Promise<GearItem> {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return (await res.json()) as GearItem;
}

export function UnderConstructionTable({
  canManageImages = false,
  canToggleAutoSubmit = false,
  items,
}: {
  canManageImages?: boolean;
  canToggleAutoSubmit?: boolean;
  items: UnderConstructionRowData[];
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("underConstructionPage");
  const tableRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [imageRequested, setImageRequested] = useState(false);
  const [imageRequestVersion, setImageRequestVersion] = useState(0);
  const [revealedRowId, setRevealedRowId] = useState<string | null>(null);
  const [selected, setSelected] = useState<{
    id: string;
    slug: string;
    type: GearType;
  } | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showMissingOnly, setShowMissingOnly] = useState(true);
  const {
    cancelLeave,
    confirmLeave,
    isConfirmOpen,
    navigateAfterHistoryTrap,
    requestLeave,
  } = useUnsavedChangesGuard({
    interceptHistory: true,
    isDirty,
  });
  const selectedEditDataUrl =
    selected && (open || imageOpen || imageRequested)
      ? buildGearEditDataUrl(
          selected.slug,
          imageOpen || imageRequested ? imageRequestVersion : undefined,
        )
      : null;
  const {
    data: gearData,
    error,
    isLoading: loading,
  } = useSWR<GearItem>(selectedEditDataUrl, fetchGearEditData);

  if (error) {
    console.error("[UnderConstructionTable] fetch edit-data error", error);
  }

  useEffect(() => {
    if (!revealedRowId) return;

    const dismissRevealedRow = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !tableRef.current?.contains(event.target)
      ) {
        setRevealedRowId(null);
      }
    };

    document.addEventListener("pointerdown", dismissRevealedRow);
    return () => {
      document.removeEventListener("pointerdown", dismissRevealedRow);
    };
  }, [revealedRowId]);

  useEffect(() => {
    if (!imageRequested) return;
    if (gearData) {
      setImageOpen(true);
      setImageRequested(false);
    } else if (error) {
      toast.error(t("imageLoadError"));
      setImageRequested(false);
    }
  }, [error, gearData, imageRequested, t]);

  const requestClose = useCallback(
    (opts?: { force?: boolean }) => {
      requestLeave(() => {
        setOpen(false);
        setIsDirty(false);
      }, opts);
    },
    [requestLeave],
  );

  const handleSubmitSuccess = useCallback(
    (result: GearEditSubmissionSuccess) => {
      handleGearEditSubmissionSuccess({
        result,
        closeToGear: () => requestClose({ force: true }),
        navigateToSuccess: (href) => {
          setOpen(false);
          navigateAfterHistoryTrap(() =>
            router.replace(localizePathname(href, locale as Locale)),
          );
        },
      });
    },
    [locale, navigateAfterHistoryTrap, requestClose, router],
  );

  const handleOpen = useCallback((id: string, slug: string, type: GearType) => {
    setSelected({ id, slug, type });
    setIsDirty(false);
    setShowMissingOnly(true); // default to missing-only when launched from this page
    setOpen(true);
  }, []);

  const handleImageOpen = useCallback(
    (id: string, slug: string, type: GearType) => {
      setSelected({ id, slug, type });
      setImageOpen(false);
      setImageRequestVersion((version) => version + 1);
      setImageRequested(true);
    },
    [],
  );

  return (
    <>
      <div
        ref={tableRef}
        className="rounded-md border"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setRevealedRowId(null);
          }
        }}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("item")}</TableHead>
              <TableHead>{t("images")}</TableHead>
              <TableHead>{t("missing")}</TableHead>
              <TableHead>{t("progress")}</TableHead>
              <TableHead className="text-right">{t("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it, idx) => {
              return (
                <UnderConstructionRow
                  key={it.id}
                  canManageImages={canManageImages}
                  index={idx}
                  isLoadingImages={imageRequested && selected?.id === it.id}
                  isRevealed={revealedRowId === it.id}
                  item={it}
                  onEdit={handleOpen}
                  onManageImages={handleImageOpen}
                  onReveal={setRevealedRowId}
                />
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
        <DialogContent className="p-0 sm:max-w-4xl" showCloseButton={false}>
          <div className="flex max-h-[90vh] flex-col">
            {selected && !loading && gearData && (
              <EditModalContent
                canToggleAutoSubmit={canToggleAutoSubmit}
                gearType={selected.type as any}
                gearSlug={selected.slug}
                gearData={gearData}
                onDirtyChange={setIsDirty}
                onRequestClose={requestClose}
                onSubmitSuccess={handleSubmitSuccess}
                initialShowMissingOnly={showMissingOnly}
                formId="edit-gear-form"
              />
            )}
            {selected && loading && (
              <div className="flex max-h-[90vh] flex-col">
                <div className="px-6 pt-6 pb-4">
                  <DialogHeader>
                    <DialogTitle>
                      {t("editItem", { slug: selected?.slug ?? "" })}
                    </DialogTitle>
                  </DialogHeader>
                </div>
                <div className="flex min-h-[400px] flex-1 items-center justify-center p-6">
                  <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                  <span className="text-muted-foreground ml-2 text-sm">
                    {t("loading")}
                  </span>
                </div>
                <div className="bg-background border-t px-6 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="uc-loading-missing-only">
                        {t("showMissingOnly")}
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
                        {t("cancel")}
                      </button>
                      <button
                        type="button"
                        disabled
                        className="bg-primary text-primary-foreground/60 h-9 cursor-not-allowed rounded-md px-4 text-sm"
                      >
                        {t("continue")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selected && gearData && (imageOpen || imageRequested) ? (
        <GearImageModal
          open={imageOpen}
          onOpenChange={setImageOpen}
          trigger={null}
          gearId={gearData.id}
          slug={selected.slug}
          gearType={selected.type}
          currentThumbnailUrl={gearData.thumbnailUrl ?? undefined}
          currentTopViewUrl={gearData.topViewUrl ?? undefined}
          currentRearViewUrl={gearData.rearViewUrl ?? undefined}
          currentLeftViewUrl={gearData.leftViewUrl ?? undefined}
          currentRightViewUrl={gearData.rightViewUrl ?? undefined}
          currentColorways={gearData.colorways ?? undefined}
          onSuccess={() => router.refresh()}
        />
      ) : null}

      <AlertDialog
        open={isConfirmOpen}
        onOpenChange={(open) => {
          if (!open) cancelLeave();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("discardTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("discardDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelLeave}>
              {t("stay")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeave}>
              {t("discardAndExit")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default UnderConstructionTable;
