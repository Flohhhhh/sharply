"use client";
import { track } from "@vercel/analytics";
import { useTranslations } from "next-intl";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { FaDiscord, FaGoogle } from "react-icons/fa";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { emailOtp, signIn } from "~/lib/auth/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Fingerprint } from "lucide-react";
import { getAuthCallbackUrlForOrigin } from "~/lib/auth/callback-url";
import { LocaleLink } from "~/components/locale-link";

type ProviderAvailability = Record<
  "google" | "discord",
  { enabled: boolean; missing: string[] }
>;

export default function SignInClient({
  providerAvailability,
  emailOtpAvailability,
}: {
  providerAvailability: ProviderAvailability;
  emailOtpAvailability: { enabled: boolean; missing: string[] };
}) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [passkeySigningIn, setPasskeySigningIn] = useState(false);
  const canSubmit = /.+@.+\..+/.test(email);

  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  // Handle OAuth errors from URL parameters
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      let errorMessage = t("authErrorDefault");
      let errorDescription = "";

      switch (error) {
        case "OAuthAccountNotLinked":
          errorMessage = t("authErrorEmailUsed");
          errorDescription = t("authErrorEmailUsedDescription");
          break;
        case "OAuthSignin":
          errorMessage = t("authErrorProblemSigningIn");
          errorDescription = t("authErrorProblemSigningInShort");
          break;
        case "OAuthCallback":
          errorMessage = t("authErrorCallback");
          break;
        case "OAuthCreateAccount":
          errorMessage = t("authErrorCreateAccount");
          break;
        case "EmailCreateAccount":
          errorMessage = t("authErrorEmailCreateAccount");
          break;
        case "Callback":
          errorMessage = t("authErrorCallback");
          break;
        case "OAuthSignin":
          errorMessage = `${t("authErrorProblemSigningIn")} ${t("authErrorProblemSigningInShort")}`;
          break;
        case "EmailSignin":
          errorMessage = t("authErrorEmailSignin");
          break;
        case "CredentialsSignin":
          errorMessage = t("authErrorCredentials");
          break;
        case "SessionRequired":
          errorMessage = t("authErrorSessionRequired");
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
  async function handleOAuthSignIn(provider: keyof ProviderAvailability) {
    const providerInfo = providerAvailability[provider];
    if (!providerInfo?.enabled) {
      const providerLabel = provider === "google" ? "Google" : "Discord";
      const missingVars =
        providerInfo?.missing.join(" and ") || "required environment variables";
      toast.error(t("oauthNotConfigured", { provider: providerLabel }), {
        description: t("oauthNotConfiguredDescription", {
          missingVars,
          provider: providerLabel,
        }),
        richColors: true,
        duration: 10000,
      });
      return;
    }

    void track("auth_signin_press", {
      method: "oauth",
      provider,
    });
    try {
      const authCallbackUrl = getAuthCallbackUrlForOrigin(
        callbackUrl,
        window.location.origin,
        {
          baseOrigin: process.env.NEXT_PUBLIC_BASE_URL,
          debugLabel: "signin_social",
        },
      );
      console.info("[auth-callback-debug] signin_social_request", {
        provider,
        callbackUrl,
        currentOrigin: window.location.origin,
        baseOrigin: process.env.NEXT_PUBLIC_BASE_URL,
        authCallbackUrl,
      });
      const { data, error } = await signIn.social({
        provider,
        callbackURL: authCallbackUrl,
        disableRedirect: true,
      });

      if (error) {
        console.error("[auth-callback-debug] signin_social_error", {
          provider,
          callbackUrl,
          authCallbackUrl,
          message: error.message,
        });
        toast.error(t("signInFailed"), {
          richColors: true,
          description: error.message,
        });
      } else {
        console.info("[auth-callback-debug] signin_social_success", {
          provider,
          callbackUrl,
          authCallbackUrl,
          redirectUrl: data.url,
        });
        router.push(data.url ?? "/");
      }
    } catch (error) {
      console.error("[auth-callback-debug] signin_social_exception", {
        provider,
        callbackUrl,
        message: error instanceof Error ? error.message : String(error),
      });
      toast.error(t("unexpectedError"));
    }
  }

  async function handleEmailOtpSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit || sending) return;

    if (!emailOtpAvailability.enabled) {
      const missingVars =
        emailOtpAvailability.missing.join(" and ") ||
        "RESEND_EMAIL_FROM and RESEND_API_KEY";
      toast.error(t("emailNotConfigured"), {
        description: t("emailNotConfiguredDescription", { missingVars }),
        richColors: true,
        duration: 10000,
      });
      return;
    }

    if (!emailOtp?.sendVerificationOtp) {
      toast.error(t("emailOtpUnavailable"));
      return;
    }

    try {
      setSending(true);
      void track("auth_signin_press", {
        method: "email_otp",
        callbackUrl,
      });
      const { error } = await emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });
      if (error) {
        toast.error(t("failedToSendCode"), { description: error.message });
        return;
      }
      toast.success(t("codeSent"));
      router.push(
        `/auth/verify-otp?email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`,
      );
    } catch (err) {
      console.error("Failed to send OTP", err);
      toast.error(t("failedToSendCodeTryAgain"));
    } finally {
      setSending(false);
    }
  }

  async function handlePasskeySignIn() {
    setPasskeySigningIn(true);
    void track("auth_signin_press", { method: "passkey", callbackUrl });
    try {
      const { error } = await signIn.passkey({
        fetchOptions: {
          onSuccess() {
            router.push(callbackUrl);
          },
        },
      });

      if (error) {
        toast.error(t("passkeyFailed"), {
          description: error.message || t("passkeyFailedDescription"),
          richColors: true,
          action: {
            label: t("signUp"),
            onClick: () =>
              router.push("/auth/signin?callbackUrl=/profile/settings"),
          },
        });
        return;
      }

      console.warn(
        "Reached unhandled passkey sign in case. Please investigate.",
      );
      router.refresh();
    } catch (err) {
      console.error("Passkey sign-in failed", err);
      toast.error(
        `${t("passkeyFailed")} ${t("authErrorProblemSigningInShort")}`,
      );
    } finally {
      setPasskeySigningIn(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-12 md:py-20">
      <div className="overflow-hidden rounded-xl border md:grid md:min-h-[560px] md:grid-cols-2">
        <div className="dark:bg-accent/50 bg-white p-8 md:border-r md:p-10">
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("welcome")}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("signInSubtitle")}
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

          <div className="mt-4">
            <Button
              variant="default"
              className="w-full"
              onClick={handlePasskeySignIn}
              disabled={passkeySigningIn}
              loading={passkeySigningIn}
            >
              <Fingerprint className="mr-2 h-4 w-4" />
              {t("signInWithPasskey")}
            </Button>
          </div>

          {/* Email OTP sign-in */}
          <div className="mt-5 space-y-5">
            <div className="text-muted-foreground relative py-2 text-center text-xs">
              <span className="relative px-2">{t("continueWithEmail")}</span>
              <div className="bg-border absolute inset-x-0 top-1/2 -z-10 h-px -translate-y-1/2" />
            </div>
            <form onSubmit={handleEmailOtpSubmit} className="space-y-5">
              <div className="space-y-2">
                <Input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  autoComplete="email webauthn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-muted-foreground text-xs">
                  {t("emailHint")}
                </p>
              </div>
              <Button
                className="w-full"
                type="submit"
                disabled={!canSubmit || sending}
                loading={sending}
              >
                {t("sendCode")}
              </Button>
            </form>
          </div>
        </div>
        <div className="bg-muted/40 relative hidden md:block">
          <Image
            src="https://8v5lpkd4bi.ufs.sh/f/mJwI0W8NBfTnB3KMvJ7vikqlWn1GuLPstQJdMA7DVCZgzOTo"
            alt={t("signInImageAlt")}
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
        {t.rich("agreeToTerms", {
          terms: () => (
            <LocaleLink
              href="/terms-of-service"
              className="underline underline-offset-4"
            >
              {tCommon("termsOfService")}
            </LocaleLink>
          ),
          privacy: () => (
            <LocaleLink
              href="/privacy-policy"
              className="underline underline-offset-4"
            >
              {tCommon("privacy")}
            </LocaleLink>
          ),
        })}
      </p>
    </div>
  );
}
