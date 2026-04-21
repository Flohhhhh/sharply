"use client";

import type { Passkey } from "@better-auth/passkey";
import { ChevronDown,Fingerprint,Loader,Pencil,Trash } from "lucide-react";
import { useLocale,useTranslations } from "next-intl";
import { useMemo,useState } from "react";
import { toast } from "sonner";
import { LocaleLink } from "~/components/locale-link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
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
import { passkey } from "~/lib/auth/auth-client";
import { formatDate } from "~/lib/format/date";

type PasskeySectionProps = {
  initialPasskeys: Passkey[];
};

export function PasskeySection({ initialPasskeys }: PasskeySectionProps) {
  const t = useTranslations("profileSettings");
  const locale = useLocale();
  const [items, setItems] = useState<Passkey[]>(initialPasskeys);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Passkey | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  const countLabel = useMemo(() => {
    const count = items.length;
    if (count === 0) return t("noPasskeysConfigured");
    if (count === 1) return t("onePasskeyConfigured");
    return t("manyPasskeysConfigured", { count });
  }, [items.length, t]);

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    const target = items.find((p) => p.id === id);
    if (!target) return;

    setDeletingId(id);
    const toastId = toast.loading(t("deletingPasskey"));
    try {
      const { error } = await passkey.deletePasskey({ id });
      if (error) throw new Error(error.message);
      setItems((prev) => prev.filter((p) => p.id !== id));
      toast.success(t("passkeyDeleted"));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("passkeyDeleteFailed");
      toast.error(message);
    } finally {
      toast.dismiss(toastId);
      setDeletingId(null);
    }
  };

  const handleOpenRename = (record: Passkey) => {
    setRenameTarget(record);
    setRenameValue(record.name ?? "");
  };

  const handleSaveRename = async () => {
    if (!renameTarget) return;
    const nextName = renameValue.trim();
    if (!nextName || renaming) return;

    setRenaming(true);
    const toastId = toast.loading(t("savingName"));
    try {
      const { error } = await passkey.updatePasskey({
        id: renameTarget.id,
        name: nextName,
      });
      if (error) throw new Error(error.message);
      setItems((prev) =>
        prev.map((p) =>
          p.id === renameTarget.id ? { ...p, name: nextName } : p,
        ),
      );
      toast.success(t("passkeyRenamed"));
      setRenameTarget(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("passkeyRenameFailed");
      toast.error(message);
    } finally {
      toast.dismiss(toastId);
      setRenaming(false);
    }
  };

  const formatLastUse = (item: Passkey) => {
    const ts = item.createdAt;
    if (!ts) return null;
    return formatDate(ts, {
      locale,
      preset: "datetime-short",
      fallback: "",
    });
  };

  return (
    <section className="border-border space-y-3 rounded-lg border p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{t("passkeys")}</h2>
        <p className="text-muted-foreground text-sm">{t("passkeysDescription")}</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild>
          <LocaleLink href="/profile/settings/add-passkey">
            <Fingerprint className="mr-2 h-4 w-4" />
            {t("addPasskey")}
          </LocaleLink>
        </Button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-muted-foreground inline-flex items-center gap-2 text-sm font-medium"
          aria-expanded={open}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
          {countLabel}
        </button>
      </div>

      {open ? (
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("noPasskeysYet")}
            </p>
          ) : (
            <ul className="divide-border divide-y rounded-md border">
              {items.map((item) => {
                const lastUse = formatLastUse(item);

                return (
                  <li
                    key={item.id}
                    className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.deviceType ? `${item.deviceType}` : t("device")}
                        {item.backedUp ? ` · ${t("synced")}` : ""}
                        {lastUse ? ` · ${t("addedAt", { value: lastUse })}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                    <Dialog
                      open={renameTarget?.id === item.id}
                      onOpenChange={(open) => {
                        if (open) {
                          handleOpenRename(item);
                        } else {
                          setRenameTarget(null);
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Pencil className="mr-2 h-4 w-4" />
                          {t("rename")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t("renamePasskey")}</DialogTitle>
                          <DialogDescription>
                            {t("renamePasskeyDescription")}
                          </DialogDescription>
                        </DialogHeader>
                        <Input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          disabled={renaming}
                          autoFocus
                        />
                        <DialogFooter>
                          <Button
                            variant="ghost"
                            onClick={() => setRenameTarget(null)}
                            disabled={renaming}
                          >
                            {t("cancel")}
                          </Button>
                          <Button
                            onClick={handleSaveRename}
                            disabled={renaming || !renameValue.trim()}
                          >
                            {renaming ? (
                              <Loader className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Fingerprint className="mr-2 h-4 w-4" />
                            )}
                            {t("save")}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deletingId === item.id}
                        >
                          {deletingId === item.id ? (
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash className="mr-2 h-4 w-4" />
                          )}
                          {t("delete")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("deletePasskeyTitle")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("deletePasskeyDescription", {
                              name: item.name ?? t("device"),
                            })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={deletingId === item.id}>
                            {t("cancel")}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                          >
                            {t("confirmDelete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}
