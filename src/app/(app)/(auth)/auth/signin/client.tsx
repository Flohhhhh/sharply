"use client";
import { track } from "@vercel/analytics";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Apple, Image as ImageIcon } from "lucide-react";
import { FaDiscord, FaGoogle } from "react-icons/fa";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

export default function SignInClient() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const canSubmit = /.+@.+\..+/.test(email);

  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  // Handle OAuth errors from URL parameters
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      let errorMessage = "An error occurred during sign in.";
      let errorDescription = "";

      switch (error) {
        case "OAuthAccountNotLinked":
          errorMessage = "Email already used";
          errorDescription =
            "Please sign in with the method you originally used, or contact support if you need help linking accounts.";
          break;
        case "OAuthSignin":
          errorMessage = "There was a problem signing in.";
          errorDescription = "Please try again.";
          break;
        case "OAuthCallback":
          errorMessage =
            "There was a problem with the authentication callback. Please try again.";
          break;
        case "OAuthCreateAccount":
          errorMessage = "Could not create account. Please try again.";
          break;
        case "EmailCreateAccount":
          errorMessage =
            "Could not create account with this email. Please try again.";
          break;
        case "Callback":
          errorMessage =
            "There was a problem with the authentication callback. Please try again.";
          break;
        case "OAuthSignin":
          errorMessage = "There was a problem signing in. Please try again.";
          break;
        case "EmailSignin":
          errorMessage =
            "There was a problem sending the sign in email. Please try again.";
          break;
        case "CredentialsSignin":
          errorMessage =
            "Invalid credentials. Please check your email and password.";
          break;
        case "SessionRequired":
          errorMessage = "Please sign in to access this page.";
          break;
        default:
          errorMessage = `Sign in failed: ${error}`;
      }

      toast.error(errorMessage, {
        description: errorDescription,
        richColors: true,
        duration: 10000,
      });

      // Clean up the URL by removing the error parameter
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("error");
      const newUrl = `${window.location.pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ""}`;
      router.replace(newUrl);
    }
  }, [searchParams, router]);

  // Handle OAuth sign-in with error handling
  async function handleOAuthSignIn(provider: string) {
    void track("auth_signin_press", {
      method: "oauth",
      provider,
    });
    try {
      const result = await signIn(provider, {
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Sign in failed. Please try again.");
      } else if (result?.ok) {
        router.push(callbackUrl);
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit || sending) return;
    try {
      setSending(true);
      void track("auth_signin_press", {
        method: "magic_link",
        callbackUrl,
      });
      await signIn("resend", {
        email,
        callbackUrl,
        redirect: false,
        replyTo: "admin@sharplyphoto.com",
      });
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
        <div className="dark:bg-accent/50 bg-white p-8 md:border-r md:p-10">
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Login to your Sharply account
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* <Button variant="outline" className="w-full" disabled>
                <Apple className="mr-2 h-4 w-4" /> Apple
              </Button> */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthSignIn("google")}
            >
              <FaGoogle className="mr-2 size-4" />
              Google
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthSignIn("discord")}
            >
              <FaDiscord className="mr-2 size-4" /> Discord
            </Button>
          </div>

          <div className="mt-5 space-y-5">
            <div className="text-muted-foreground relative py-2 text-center text-xs">
              <span className="relative px-2">or continue with email</span>
              <div className="bg-border absolute inset-x-0 top-1/2 -z-10 h-px -translate-y-1/2" />
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                {/* <Label htmlFor="email">Email</Label> */}
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
          <Image
            src="https://8v5lpkd4bi.ufs.sh/f/mJwI0W8NBfTnB3KMvJ7vikqlWn1GuLPstQJdMA7DVCZgzOTo"
            alt="Sign in"
            fill
            className="object-cover"
          />
          {/* subtle bottom gradient for text readability */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent"
            aria-hidden
          />
          <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-[10px] leading-none text-white/90">
            Photo by Rohit Sharma on Unsplash
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
