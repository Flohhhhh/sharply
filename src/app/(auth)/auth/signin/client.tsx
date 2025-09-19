"use client";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Apple, Image as ImageIcon } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { useState } from "react";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInClient() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const canSubmit = /.+@.+\..+/.test(email);

  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit || sending) return;
    try {
      setSending(true);
      await signIn("resend", { email, callbackUrl, redirect: false });
      router.push(
        `/auth/verify?email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`,
      );
    } catch {
      toast("Failed to send magic link. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-12 md:py-20">
      <div className="overflow-hidden rounded-xl border md:grid md:min-h-[560px] md:grid-cols-2">
        <div className="bg-white p-8 md:border-r md:p-10">
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Login to your Sharply account
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              type="submit"
              disabled={!canSubmit || sending}
              loading={sending}
            >
              Send magic link
            </Button>
          </form>
          <div className="space-y-5">
            <div className="text-muted-foreground relative py-2 text-center text-xs">
              <span className="relative px-2">or continue with</span>
              <div className="bg-border absolute inset-x-0 top-1/2 -z-10 h-px -translate-y-1/2" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Button variant="outline" className="w-full" disabled>
                <Apple className="mr-2 h-4 w-4" /> Apple
              </Button>
              <Button variant="outline" className="w-full" disabled>
                <span className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded-full border">
                  G
                </span>
                Google
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => signIn("discord", { callbackUrl })}
              >
                <FaDiscord className="mr-2 size-4" /> Discord
              </Button>
            </div>

            <p className="text-muted-foreground mt-6 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="#"
                className="font-medium underline underline-offset-4"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
        <div className="bg-muted/40 relative hidden md:block">
          <div className="absolute inset-0 grid place-items-center">
            <div className="bg-background text-muted-foreground flex h-24 w-24 items-center justify-center rounded-full border">
              <ImageIcon className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>
      <p className="text-muted-foreground mt-4 text-center text-xs">
        By clicking continue, you agree to our{" "}
        <Link href="#" className="underline underline-offset-4">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="#" className="underline underline-offset-4">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
