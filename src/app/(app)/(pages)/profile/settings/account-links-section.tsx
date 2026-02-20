"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { linkSocial, unlinkAccount } from "~/lib/auth/auth-client";
import { FaDiscord, FaGoogle } from "react-icons/fa";
import { CheckCircle2, Loader } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "~/components/ui/button";
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
import type { LinkedAccountInfo } from "~/server/auth/account-linking";
import { getAuthCallbackUrlForOrigin } from "~/lib/auth/callback-url";

type ProviderKey = "discord" | "google";

type LinkedAccounts = Record<ProviderKey, LinkedAccountInfo | null>;

type ProviderAvailability = Record<ProviderKey, boolean>;

type AccountLinksSectionProps = {
  linkedAccounts: LinkedAccounts;
  providerAvailability: ProviderAvailability;
  userEmail?: string | null;
};

const PROVIDER_METADATA: Record<
  ProviderKey,
  {
    label: string;
    icon: typeof FaDiscord;
    accentClass: string;
  }
> = {
  discord: {
    label: "Discord",
    icon: FaDiscord,
    accentClass: "text-[#5865F2]",
  },
  google: {
    label: "Google",
    icon: FaGoogle,
    accentClass: "text-[#DB4437]",
  },
};

export function AccountLinksSection({
  linkedAccounts,
  providerAvailability,
  userEmail,
}: AccountLinksSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [localLinks, setLocalLinks] = useState(linkedAccounts);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [connecting, setConnecting] = useState<ProviderKey | null>(null);

  useEffect(() => {
    setLocalLinks(linkedAccounts);
  }, [linkedAccounts]);

  const isBusy = useMemo(
    () => isPending || connecting !== null,
    [isPending, connecting],
  );

  useEffect(() => {
    const linkedProvider = searchParams.get("linked");
    if (!linkedProvider) return;
    if (linkedProvider === "discord" || linkedProvider === "google") {
      const meta = PROVIDER_METADATA[linkedProvider];
      toast.success(`${meta.label} linked`);
    }
    router.replace("/profile/settings");
  }, [router, searchParams]);

  const handleConnect = async (provider: ProviderKey) => {
    setError(null);
    setConnecting(provider);
    const toastId = toast.loading(
      `Opening ${PROVIDER_METADATA[provider].label} to link...`,
    );
    try {
      const authCallbackUrl = getAuthCallbackUrlForOrigin(
        `/profile/settings?linked=${provider}`,
        window.location.origin,
      );
      // toast.success(`Redirecting to link ${PROVIDER_METADATA[provider].label}`);
      const res = await linkSocial({
        provider,
        callbackURL: authCallbackUrl,
      });
      if (res.error) {
        throw new Error(res.error.message);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start linking";
      setError(message);
      toast.error(message);
      toast.dismiss(toastId);
      setConnecting(null);
    }
  };

  const handleDisconnect = (provider: ProviderKey, accountId: string) => {
    if (isBusy) return;
    setError(null);
    const toastId = toast.loading(
      `Disconnecting ${PROVIDER_METADATA[provider].label}...`,
    );
    startTransition(async () => {
      const { data, error } = await unlinkAccount({
        providerId: provider,
        accountId: accountId,
      });
      if (error) {
        throw new Error(error.message);
      }
      setLocalLinks((prev) => ({ ...prev, [provider]: null }));
      toast.success(`${PROVIDER_METADATA[provider].label} disconnected`);
      toast.dismiss(toastId);
      setConnecting(null);
    });
  };

  return (
    <section className="border-border space-y-4 rounded-lg border p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Connected Accounts</h2>
      </div>

      <div className="space-y-3">
        {(["discord", "google"] as ProviderKey[]).map((provider) => {
          const link = localLinks[provider];
          const available = providerAvailability[provider];
          const meta = PROVIDER_METADATA[provider];
          const Icon = meta.icon;
          const otherProvider: ProviderKey =
            provider === "discord" ? "google" : "discord";
          const isLastLinkedOAuth = !!link && !localLinks[otherProvider];

          if (!link) {
            return (
              <div key={provider} className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 rounded-lg"
                  disabled={!available || connecting === provider}
                  onClick={() => handleConnect(provider)}
                >
                  {connecting === provider ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon className={`${meta.accentClass} h-4 w-4`} />
                  )}
                  {available
                    ? `Link a ${meta.label} account`
                    : `${meta.label} linking disabled`}
                </Button>
                {!available ? (
                  <p className="text-muted-foreground text-xs">
                    This provider is not configured for this environment.
                  </p>
                ) : null}
              </div>
            );
          }

          return (
            <div
              key={provider}
              className="border-border flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-3">
                <Icon className={`${meta.accentClass} h-5 w-5`} />
                <div className="space-y-0.5">
                  <p className="font-medium">{meta.label}</p>
                  <p className="text-muted-foreground text-sm">
                    Connected as {userEmail || link.providerAccountId}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isBusy}>
                      {isPending ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        "Disconnect"
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Disconnect {meta.label}?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <p>
                          You will not be able to sign in with this provider
                          until you link it again.
                        </p>
                        {isLastLinkedOAuth ? (
                          <p>
                            This is your last linked OAuth account. If you
                            continue, you will need to sign in using your
                            email/magic link.
                          </p>
                        ) : null}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isBusy}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          handleDisconnect(provider, link.providerAccountId)
                        }
                        disabled={isBusy}
                      >
                        Disconnect
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          );
        })}
      </div>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
