"use client";

import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import UserCard from "~/app/[locale]/(auth)/auth/welcome/user-card";
import type { AuthUser } from "~/auth";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "~/components/ui/dialog";

type ShowUserCardButtonProps = {
  user: AuthUser;
};

export function ShowUserCardButton({ user }: ShowUserCardButtonProps) {
  const t = useTranslations("userProfile");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">{t("showUserCard")}</Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="border-0 bg-transparent p-0 shadow-none sm:max-w-fit"
      >
        <UserCard user={user} showActions={false} className="flex" />
        <div className="mt-4 flex justify-center">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t("close")}
            >
              <XIcon />
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
