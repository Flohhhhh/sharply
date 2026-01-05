"use client";

import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "~/lib/hooks/useDebounce";
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Check, Loader2, X } from "lucide-react";
import { actionUpdateUserHandle } from "~/server/users/actions";

interface UserHandleFormProps {
  initialHandle: string | null;
  memberNumber: number | null | undefined;
}

export function UserHandleForm({
  initialHandle,
  memberNumber,
}: UserHandleFormProps) {
  const [handle, setHandle] = useState(initialHandle ?? "");
  const debouncedHandle = useDebounce(handle, 500);
  const [isChecking, setIsChecking] = useState(false);
  const [availability, setAvailability] = useState<{
    available: boolean;
    reason: string | null;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const checkAvailability = useCallback(
    async (h: string) => {
      if (h === initialHandle) {
        setAvailability(null);
        setIsChecking(false);
        return;
      }
      if (h.length < 3) {
        setAvailability({ available: false, reason: "Too short" });
        setIsChecking(false);
        return;
      }
      try {
        const res = await fetch(
          `/api/users/check-handle?h=${encodeURIComponent(h)}`,
        );
        const data = await res.json();
        setAvailability(data);
      } catch (err) {
        console.error("Failed to check handle", err);
      } finally {
        setIsChecking(false);
      }
    },
    [initialHandle],
  );

  useEffect(() => {
    if (debouncedHandle === initialHandle || !debouncedHandle) {
      setAvailability(null);
      setIsChecking(false);
      return;
    }

    if (debouncedHandle.length >= 3) {
      void checkAvailability(debouncedHandle);
    } else {
      setAvailability({ available: false, reason: "Too short" });
      setIsChecking(false);
    }
  }, [debouncedHandle, initialHandle, checkAvailability]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!availability?.available || isUpdating) return;

    setIsUpdating(true);
    try {
      const res = await actionUpdateUserHandle(handle);
      if (res.ok) {
        toast.success("Handle updated successfully!");
        setAvailability(null);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update handle");
    } finally {
      setIsUpdating(false);
    }
  }

  const showSuccess =
    availability?.available && !isChecking && handle === debouncedHandle;
  const showError =
    availability &&
    !availability.available &&
    !isChecking &&
    handle === debouncedHandle;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="relative">
          <div className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm select-none">
            /u/
          </div>
          <Input
            value={handle}
            onChange={(e) => {
              setHandle(e.target.value.toLowerCase().replace(/\s+/g, "-"));
              setAvailability(null);
              setIsChecking(true);
            }}
            placeholder={initialHandle || `user-${memberNumber ?? "?"}`}
            className="pl-[26px]"
            maxLength={50}
          />
          <div className="absolute top-1/2 right-3 -translate-y-1/2">
            {isChecking && (
              <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            )}
            {showSuccess && <Check className="h-4 w-4 text-green-500" />}
            {showError && <X className="text-destructive h-4 w-4" />}
          </div>
        </div>
        {showError && (
          <p className="text-destructive text-xs">{availability.reason}</p>
        )}
        {!availability && !initialHandle && handle === "" && (
          <p className="text-muted-foreground text-xs">
            Currently using default: user-{memberNumber ?? "?"}
          </p>
        )}
      </div>
      <Button
        type="submit"
        disabled={!showSuccess || isUpdating}
        loading={isChecking || isUpdating}
      >
        Update Handle
      </Button>
    </form>
  );
}
