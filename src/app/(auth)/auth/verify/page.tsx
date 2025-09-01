"use client";
import Link from "next/link";
import { MailCheck, Image as ImageIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const email = searchParams.get("email") ?? "";
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-12 md:py-20">
      <div className="overflow-hidden rounded-xl border md:grid md:min-h-[560px] md:grid-cols-2">
        <div className="bg-white p-8 md:border-r md:p-10">
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-2xl font-semibold tracking-tight">
              Check your email
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              We&apos;ve sent you a magic sign-in link. Open it to continue.
            </p>
          </div>
          <div className="flex flex-col items-center gap-6 text-center md:items-start md:text-left">
            <div className="text-muted-foreground rounded-full border p-4">
              <MailCheck className="h-8 w-8" />
            </div>
            <p className="text-muted-foreground text-sm">
              Didn&apos;t receive the email? Check your spam folder or try
              again.
            </p>
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <Button asChild className="w-full sm:w-auto" variant="secondary">
                <Link
                  href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                >
                  Back to sign in
                </Link>
              </Button>
              {email ? (
                <Button
                  className="w-full sm:w-auto"
                  variant="outline"
                  onClick={async () => {
                    await signIn("resend", {
                      email,
                      callbackUrl,
                      redirect: false,
                    });
                    toast("Magic link resent.");
                  }}
                >
                  Resend link
                </Button>
              ) : null}
            </div>
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
        By continuing, you agree to our{" "}
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
