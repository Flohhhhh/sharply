"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { actionUpdateDisplayName } from "~/server/users/actions";

type DisplayNameFormProps = {
  defaultName: string;
  onSuccess?: (name: string) => void;
};

export function DisplayNameForm({
  defaultName,
  onSuccess,
}: DisplayNameFormProps) {
  const [name, setName] = useState(defaultName);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(defaultName);
  }, [defaultName]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        setError(null);
        const res = await actionUpdateDisplayName(name);
        if (res.ok) {
          setName(res.name);
          onSuccess?.(res.name);
        } else {
          setError("Could not update your display name. Please try again.");
        }
      } catch (err) {
        setError("Failed to update display name. Please try again.");
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name</Label>
        <Input
          id="displayName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your display name"
          aria-label="Display Name"
        />
        <p className="text-muted-foreground text-xs">
          This is what other users will see when they visit your profile or when
          you write reviews.
        </p>
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <Button type="submit" disabled={isPending} loading={isPending}>
        Save Changes
      </Button>
    </form>
  );
}
