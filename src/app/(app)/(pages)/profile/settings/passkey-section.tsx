"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Fingerprint, Trash, Loader, ChevronDown, Pencil } from "lucide-react";
import { passkey } from "~/lib/auth/auth-client";
import { toast } from "sonner";
import { format } from "date-fns";
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

type PasskeyRecord = {
  id: string;
  name: string;
  createdAt?: string | null;
  deviceType?: string | null;
  backedUp?: boolean | null;
  transports?: string | null;
  lastUsedAt?: string | null;
};

type PasskeySectionProps = {
  initialPasskeys: PasskeyRecord[];
};

export function PasskeySection({ initialPasskeys }: PasskeySectionProps) {
  const [items, setItems] = useState<PasskeyRecord[]>(initialPasskeys);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<PasskeyRecord | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  const countLabel = useMemo(() => {
    const count = items.length;
    if (count === 0) return "No passkeys configured";
    if (count === 1) return "1 passkey configured";
    return `${count} passkeys configured`;
  }, [items.length]);

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    const target = items.find((p) => p.id === id);
    if (!target) return;

    setDeletingId(id);
    const toastId = toast.loading("Deleting passkey...");
    try {
      const { error } = await passkey.deletePasskey({ id });
      if (error) throw new Error(error.message);
      setItems((prev) => prev.filter((p) => p.id !== id));
      toast.success("Passkey deleted");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete passkey.";
      toast.error(message);
    } finally {
      toast.dismiss(toastId);
      setDeletingId(null);
    }
  };

  const handleOpenRename = (record: PasskeyRecord) => {
    setRenameTarget(record);
    setRenameValue(record.name);
  };

  const handleSaveRename = async () => {
    if (!renameTarget) return;
    const nextName = renameValue.trim();
    if (!nextName || renaming) return;

    setRenaming(true);
    const toastId = toast.loading("Saving name…");
    try {
      const { error } = await passkey.updatePasskey({
        id: renameTarget.id,
        name: nextName,
      });
      if (error) throw new Error(error.message);
      setItems((prev) =>
        prev.map((p) => (p.id === renameTarget.id ? { ...p, name: nextName } : p)),
      );
      toast.success("Passkey renamed");
      setRenameTarget(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to rename passkey.";
      toast.error(message);
    } finally {
      toast.dismiss(toastId);
      setRenaming(false);
    }
  };

  const formatLastUse = (item: PasskeyRecord) => {
    const ts = item.lastUsedAt || item.createdAt;
    if (!ts) return null;
    try {
      return format(new Date(ts), "PPP p");
    } catch {
      return null;
    }
  };

  return (
    <section className="border-border space-y-3 rounded-lg border p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Passkeys</h2>
        <p className="text-muted-foreground text-sm">
          Register a passkey for passwordless sign-in. We prefill a device-friendly name
          (e.g., &ldquo;Firefox on Windows&rdquo;) and you can keep or change it.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild>
          <Link href="/profile/settings/add-passkey">
            <Fingerprint className="mr-2 h-4 w-4" />
            Add passkey
          </Link>
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
              No passkeys yet. Add one to get started.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-md border">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.deviceType ? `${item.deviceType}` : "Device"}
                      {item.backedUp ? " · Synced" : ""}
                      {formatLastUse(item)
                        ? ` · Last used ${formatLastUse(item)}`
                        : item.createdAt
                          ? ` · Added ${format(new Date(item.createdAt), "PPP")}`
                          : ""}
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
                          Rename
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Rename passkey</DialogTitle>
                          <DialogDescription>
                            Choose a name to help you recognize this device later.
                          </DialogDescription>
                        </DialogHeader>
                        <Input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          disabled={renaming}
                          autoFocus
                        />
                        <DialogFooter>
                          <Button variant="ghost" onClick={() => setRenameTarget(null)} disabled={renaming}>
                            Cancel
                          </Button>
                          <Button onClick={handleSaveRename} disabled={renaming || !renameValue.trim()}>
                            {renaming ? (
                              <Loader className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Fingerprint className="mr-2 h-4 w-4" />
                            )}
                            Save
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
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete passkey?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {`You will not be able to sign in with "${item.name}" after deletion.`}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={deletingId === item.id}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                          >
                            Confirm delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}

