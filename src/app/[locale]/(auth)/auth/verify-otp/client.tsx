"use client";

import { track } from "@vercel/analytics";
import { Loader2,ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter,useSearchParams } from "next/navigation";
import { useMemo,useState } from "react";
import { toast } from "sonner";

import { LocaleLink } from "~/components/locale-link";
import { Button } from "~/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "~/components/ui/input-otp";
import { signIn } from "~/lib/auth/auth-client";

export default function VerifyOtpClient() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") ?? "";
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);

  const maskedEmail = useMemo(() => {
    if (!email) return "your email address";
    const [user = "", domain = ""] = email.split("@");
    if (!domain) return email;
    const maskedUser =
      user.length <= 2
        ? `${user[0] ?? ""}*`
        : `${user[0]}${"*".repeat(Math.max(1, user.length - 2))}${user.slice(-1)}`;
    return `${maskedUser}@${domain}`;
  }, [email]);

  async function verifyCode(code: string) {
    if (code.length !== 6 || submitting || completing) return;

    // ensure we have the Better Auth email OTP client
    const emailOtp = (
      signIn as {
        emailOtp?: (args: {
          email: string;
          otp: string;
          callbackURL?: string;
          disableRedirect?: boolean;
        }) => Promise<
          { data?: { url?: string }; error?: { message: string } } | undefined
        >;
      }
    ).emailOtp;

    if (!emailOtp) {
      toast.error(t("otpUnavailable"));
      return;
    }

    let success = false;
    try {
      setSubmitting(true);
      void track("auth_otp_submit", { method: "email_otp" });

      const result = await emailOtp({
        email,
        otp: code,
        callbackURL: callbackUrl,
        disableRedirect: true,
      });

      if (!result) {
        toast.error(t("somethingWentWrong"));
        return;
      }

      if (result.error) {
        toast.error(t("invalidOrExpiredCode"), {
          description: result.error.message,
        });
        return;
      }

      const nextUrl = result.data?.url ?? callbackUrl;
      setCompleting(true);
      success = true;
      router.push(nextUrl);
    } catch (error) {
      console.error("OTP verification failed", error);
      toast.error(t("couldNotVerifyCode"));
    } finally {
      if (!success) {
        setSubmitting(false);
      }
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await verifyCode(otp);
  }

  return (
    <div className="relative">
      <div
        className={`mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-12 transition-opacity duration-200 md:py-20 ${completing ? "opacity-50" : ""}`}
        aria-busy={completing}
      >
        <div className="overflow-hidden rounded-xl border md:grid md:min-h-[560px] md:grid-cols-2">
          <div className="bg-background p-8 md:border-r md:p-10">
            <div className="mb-8 text-center md:text-left">
              <h1 className="text-2xl font-semibold tracking-tight">
                {t("verifyTitle")}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("verifySubtitle", { email: maskedEmail })}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => {
                    setOtp(value);
                    if (value.length === 6) {
                      void verifyCode(value);
                    }
                  }}
                  aria-label="One-time password"
                  containerClassName="justify-center md:justify-start"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <p className="text-muted-foreground text-xs">
                  {t("verifyHint")}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={otp.length !== 6 || submitting}
                loading={submitting}
              >
                {t("continue")}
              </Button>
            </form>

            <div className="text-muted-foreground mt-6 text-center text-sm md:text-left">
              <LocaleLink
                className="underline underline-offset-4"
                href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              >
                {t("signInAnotherWay")}
              </LocaleLink>
            </div>
          </div>
          <div className="bg-muted/40 relative hidden md:block">
            <div className="absolute inset-0 grid place-items-center">
              <div className="bg-background text-muted-foreground flex h-24 w-24 items-center justify-center rounded-full border">
                <ShieldCheck className="h-10 w-10" />
              </div>
            </div>
          </div>
        </div>
        <p className="text-muted-foreground mt-4 text-center text-xs">
          {t.rich("agreeToTermsVerify", {
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
      {completing ? (
        <div className="bg-background/80 absolute inset-0 z-10 grid place-items-center backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Loader2 className="text-primary size-6 animate-spin" />
            <span className="text-foreground text-sm font-medium">
              {t("signingYouIn")}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
