"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from "~/components/ui/dialog";
import UserCard from "~/app/(app)/(auth)/auth/welcome/user-card";
import type { AuthUser } from "~/auth";
import { XIcon } from "lucide-react";

type ShowUserCardButtonProps = {
  user: AuthUser;
};

export function ShowUserCardButton({ user }: ShowUserCardButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">Show User Card</Button>
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
              aria-label="Close"
            >
              <XIcon />
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
