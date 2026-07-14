"use client";

import { KeyRound, Search, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  actionCreateDeveloperApiKeyForAdmin,
  actionRevokeDeveloperApiKeyForAdmin,
  actionSetDeveloperAccess,
} from "~/server/developer-api/actions";

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  developerAccessEnabled: boolean;
  activeKeyCount: number;
  usage: { today: number; last30Days: number };
};

type AdminKey = {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  revokedAt: Date | string | null;
};

export function DeveloperApiAdminManager({
  data,
}: {
  data: { users: AdminUser[]; keys: AdminKey[] };
}) {
  const t = useTranslations("developerApi");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return data.users;
    return data.users.filter((user) =>
      [user.name, user.email]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized)),
    );
  }, [data.users, query]);
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const visibleUsers = filteredUsers.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(() => {
      void action().then((result) => {
        if (!result.ok) setError(t("admin.actionFailed"));
        else router.refresh();
      });
    });
  }

  function updateAccess(user: AdminUser) {
    const next = !user.developerAccessEnabled;
    if (!next && !window.confirm(t("admin.removeAccessConfirm"))) return;
    run(() => actionSetDeveloperAccess(user.id, next));
  }

  function createKey(formData: FormData) {
    setError(null);
    startTransition(() => {
      void actionCreateDeveloperApiKeyForAdmin(formData).then((result) => {
        if (!result.ok) setError(t("admin.actionFailed"));
        else {
          setSecret(result.secret);
          router.refresh();
        }
      });
    });
  }

  function revokeKey(keyId: string) {
    if (!window.confirm(t("admin.revokeKeyConfirm"))) return;
    run(() => actionRevokeDeveloperApiKeyForAdmin(keyId));
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-primary text-sm font-semibold tracking-wide uppercase">
          {t("admin.eyebrow")}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {t("admin.title")}
        </h1>
        <p className="text-muted-foreground mt-2">{t("admin.description")}</p>
      </div>

      {secret ? (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle>{t("admin.secretTitle")}</CardTitle>
            <CardDescription>{t("admin.secretDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <code className="bg-background block rounded-md border p-3 text-sm break-all">
              {secret}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSecret(null)}
            >
              {t("portal.dismiss")}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.usersTitle")}</CardTitle>
          <CardDescription>{t("admin.usersDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="relative max-w-md">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
              className="pl-9"
              placeholder={t("admin.searchPlaceholder")}
            />
          </div>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <div className="space-y-4">
            {visibleUsers.map((user) => {
              const keys = data.keys.filter(
                (key) => key.userId === user.id && !key.revokedAt,
              );
              return (
                <article key={user.id} className="rounded-lg border p-4">
                  <div className="flex flex-col justify-between gap-4 md:flex-row">
                    <div>
                      <h2 className="font-semibold">
                        {user.name || user.email}
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        {user.email}
                      </p>
                      <p className="text-muted-foreground mt-2 text-xs">
                        {t("admin.usage", {
                          today: user.usage.today,
                          total: user.usage.last30Days,
                          keys: user.activeKeyCount,
                        })}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={
                        user.developerAccessEnabled ? "outline" : "default"
                      }
                      disabled={isPending}
                      onClick={() => updateAccess(user)}
                    >
                      {user.developerAccessEnabled ? (
                        <ShieldOff className="size-4" />
                      ) : (
                        <ShieldCheck className="size-4" />
                      )}
                      {user.developerAccessEnabled
                        ? t("admin.removeAccess")
                        : t("admin.grantAccess")}
                    </Button>
                  </div>
                  {user.developerAccessEnabled ? (
                    <div className="mt-4 grid gap-4 border-t pt-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
                      <div className="space-y-2">
                        {keys.length === 0 ? (
                          <p className="text-muted-foreground text-sm">
                            {t("admin.noKeys")}
                          </p>
                        ) : (
                          keys.map((key) => (
                            <div
                              key={key.id}
                              className="bg-muted/50 flex items-center justify-between rounded-md px-3 py-2 text-sm"
                            >
                              <span>
                                <KeyRound className="mr-2 inline size-4" />
                                {key.name}{" "}
                                <code className="text-muted-foreground">
                                  {key.keyPrefix}…
                                </code>
                              </span>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                disabled={isPending}
                                onClick={() => revokeKey(key.id)}
                                aria-label={t("portal.revoke")}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                      <form action={createKey} className="space-y-2">
                        <input type="hidden" name="userId" value={user.id} />
                        <Label htmlFor={`key-name-${user.id}`}>
                          {t("admin.keyName")}
                        </Label>
                        <Input
                          id={`key-name-${user.id}`}
                          name="name"
                          required
                          maxLength={100}
                          placeholder={t("admin.keyNamePlaceholder")}
                        />
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isPending || keys.length >= 3}
                        >
                          {t("admin.createKey")}
                        </Button>
                      </form>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
          <div className="flex items-center justify-between border-t pt-4 text-sm">
            <span className="text-muted-foreground">
              {t("admin.page", { current: page + 1, total: pageCount })}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
              >
                {t("admin.previous")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= pageCount - 1}
                onClick={() =>
                  setPage((current) => Math.min(pageCount - 1, current + 1))
                }
              >
                {t("admin.next")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
