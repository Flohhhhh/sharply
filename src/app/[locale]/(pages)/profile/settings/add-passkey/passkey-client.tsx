"use client";

import { useEffect, useState } from "react";
import { passkey } from "~/lib/auth/auth-client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Fingerprint, Loader, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LocaleLink } from "~/components/locale-link";

type AddPasskeyClientProps = {
  userEmail?: string;
};

function computeDefaultPasskeyName(t: ReturnType<typeof useTranslations>): string {
  if (typeof navigator === "undefined") return t("newPasskey");
  const ua = navigator.userAgent.toLowerCase();
  const brandList: string[] =
    ((navigator as any).userAgentData?.brands as Array<{ brand: string }>)?.map(
      (b) => b.brand.toLowerCase(),
    ) ?? [];

  const isWindows = ua.includes("windows");
  const isMac = ua.includes("mac os") || ua.includes("macintosh");
  const isIOS = ua.includes("iphone") || ua.includes("ipad");
  const isAndroid = ua.includes("android");
  const os = isWindows
    ? "Windows"
    : isMac
      ? "macOS"
      : isIOS
        ? "iOS"
        : isAndroid
          ? "Android"
          : t("unknownOs");

  const browser = brandList.find((b) => b.includes("chrome"))
    ? "Chrome"
    : brandList.find((b) => b.includes("edge"))
      ? "Edge"
      : brandList.find((b) => b.includes("opera"))
        ? "Opera"
        : ua.includes("firefox")
          ? "Firefox"
          : ua.includes("safari")
            ? "Safari"
            : t("genericBrowser");

  return t("browserOnOs", { browser, os });
}

export function AddPasskeyClient({ userEmail }: AddPasskeyClientProps) {
  const t = useTranslations("profileSettings");
  const locale = useLocale();
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const suggested = computeDefaultPasskeyName(t);
    setName((prev) => prev || suggested);
  }, [t]);

  const handleAdd = async () => {
    if (loading) return;
    const finalName = name.trim() || computeDefaultPasskeyName(t);

    setLoading(true);
    const toastId = toast.loading(
      t("waitingForPasskeyCreation"),
    );
    try {
      const { error } = await passkey.addPasskey({
        name: finalName,
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success(t("passkeyAdded"));

      router.push(`/${locale}/profile/settings`);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t("addPasskeyFailed");
      toast.error(message);
    } finally {
      toast.dismiss(toastId);
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-12 md:py-16">
      <div className="mb-8 flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <LocaleLink href="/profile/settings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToSettings")}
          </LocaleLink>
        </Button>
        <div className="flex-1" />
      </div>

      <div className="space-y-6 rounded-lg border p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t("addPasskeyTitle")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("addPasskeyDescription")}{" "}
            {userEmail ? t("signedInAs", { email: userEmail }) : null}
          </p>
        </div>

        <div className="space-y-2">
          <label
            className="text-foreground text-sm font-medium"
            htmlFor="passkey-name"
          >
            {t("passkeyName")}
          </label>
          <Input
            id="passkey-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="webauthn"
            disabled={loading}
            placeholder={t("passkeyNameExample")}
          />
          <p className="text-muted-foreground text-sm">
            {t("passkeyNameHelp")}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/profile/settings`)}
            disabled={loading}
          >
            {t("cancel")}
          </Button>
          <Button onClick={handleAdd} disabled={loading}>
            {loading ? (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Fingerprint className="mr-2 h-4 w-4" />
            )}
            {t("saveAndCreatePasskey")}
          </Button>
        </div>
      </div>
    </main>
  );
}
