"use client";

import { useEffect, useState } from "react";
import { passkey } from "~/lib/auth/auth-client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Fingerprint, Loader, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

type AddPasskeyClientProps = {
  userEmail?: string;
};

function computeDefaultPasskeyName(): string {
  if (typeof navigator === "undefined") return "New passkey";
  const ua = navigator.userAgent.toLowerCase();
  const brandList =
    // @ts-expect-error userAgentData not in all browsers
    navigator.userAgentData?.brands?.map((b: { brand: string }) =>
      b.brand.toLowerCase(),
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
          : "Unknown OS";

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
            : "Browser";

  return `${browser} on ${os}`;
}

export function AddPasskeyClient({ userEmail }: AddPasskeyClientProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const suggested = computeDefaultPasskeyName();
    setName((prev) => prev || suggested);
  }, []);

  const handleAdd = async () => {
    if (loading) return;
    const finalName = name.trim() || computeDefaultPasskeyName();

    setLoading(true);
    const toastId = toast.loading("Waiting for your device to create a passkey...");
    try {
      const { data, error } = await passkey.addPasskey({
        name: finalName,
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success("Passkey added");

      // Optionally refresh user session to reflect latest keys
      if (data?.url) {
        router.push(data.url);
        return;
      }

      router.push("/profile/settings");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add passkey. Please try again.";
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
          <Link href="/profile/settings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to settings
          </Link>
        </Button>
        <div className="flex-1" />
      </div>

      <div className="space-y-6 rounded-lg border p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Add a passkey</h1>
          <p className="text-muted-foreground text-sm">
            We will prefill a device-friendly name based on your browser and OS. You can keep it or
            rename it before creating the passkey. {userEmail ? `Signed in as ${userEmail}.` : null}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="passkey-name">
            Passkey name
          </label>
          <Input
            id="passkey-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="webauthn"
            disabled={loading}
            placeholder="e.g. Firefox on Windows"
          />
          <p className="text-muted-foreground text-sm">
            This helps you recognize the device later if you add multiple passkeys.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" onClick={() => router.push("/profile/settings")} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={loading}>
            {loading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Fingerprint className="mr-2 h-4 w-4" />}
            Save & create passkey
          </Button>
        </div>
      </div>
    </main>
  );
}


