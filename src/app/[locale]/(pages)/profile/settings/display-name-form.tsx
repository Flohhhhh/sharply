"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { actionUpdateDisplayName } from "~/server/users/actions";

type DisplayNameFormProps = {
  defaultName: string;
  onSuccess?: (name: string) => void;
};

export function DisplayNameForm({
  defaultName,
  onSuccess,
}: DisplayNameFormProps) {
  const t = useTranslations("profileSettings");
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        setError(null);
        const res = await actionUpdateDisplayName(name);
        if (res.ok) {
          setName(res.name);
          onSuccess?.(res.name);
          router.refresh();
        } else {
          setError(t("displayNameUpdateError"));
        }
      } catch {
        setError(t("displayNameUpdateFailed"));
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">{t("displayName")}</Label>
        <Input
          id="displayName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("displayNamePlaceholder")}
          aria-label={t("displayName")}
        />
        <p className="text-muted-foreground text-xs">
          {t("displayNameHelp")}
        </p>
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <Button type="submit" disabled={isPending} loading={isPending}>
        {t("saveChanges")}
      </Button>
    </form>
  );
}
