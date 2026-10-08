"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { AnimatePresence, motion } from "motion/react";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { Input, PasswordInput } from "@/components/shared/Inputs";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import GoogleSignInButton from "@/components/shared/GoogleSignInButton";
import OtpCodeInput, { emptyOtp } from "@/components/auth/OtpCodeInput";
import mail from "@/assets/icons/mail-big.svg";
import {
  AuthError,
  AuthHeading,
  AuthItem,
  AuthScreen,
  AuthStatus,
  FooterPill,
  FooterPillText,
  OrDivider,
  backPillClass,
  pillActionClass,
} from "@/components/auth/AuthParts";

const slide = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.22, ease: "easeInOut" as const },
};

const GOOGLE_ERRORS = [
  "NOT_INVITED",
  "DOMAIN_NOT_ALLOWED",
  "TOO_MANY_ATTEMPTS",
  "GOOGLE_FAILED",
] as const;

/**
 * Figma "Admin" → Authentication → Sign In: email + password (or Google),
 * then the 6-digit code the API emails before it opens a session (not in
 * Figma; styled like the Reset "mail sent" screen). Accounts are invitation
 * only, so there is no sign-up link.
 */
export default function LoginPageContent() {
  const t = useTranslations("Auth.login");
  const tFlow = useTranslations("Auth.flow");
  const tErrors = useTranslations("Auth.errors");
  const locale = useLocale();
  const searchParams = useSearchParams();

  const [view, setView] = useState<"credentials" | "code">("credentials");
  const [formError, setFormError] = useState("");

  // Google sign-in failures come back as ?error=<code> (lib/auth.ts).
  useEffect(() => {
    const code = searchParams.get("error");
    if (!code) return;
    setFormError(
      (GOOGLE_ERRORS as readonly string[]).includes(code)
        ? t(`google_errors.${code as (typeof GOOGLE_ERRORS)[number]}`)
        : t("google_errors.GOOGLE_FAILED"),
    );
  }, [searchParams, t]);

  // ── Step 1: email + password ──────────────────────────────────────────────

  const Schema = z.object({
    email: z.email(t("errors.email")),
    password: z.string().min(1, t("errors.password")),
  });
  type TSchema = z.infer<typeof Schema>;
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<TSchema>({ resolver: zodResolver(Schema) });

  const [email, setEmail] = useState("");
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  /** POST /auth/admin/login — checks the password and emails a code. */
  async function requestCode(data: TSchema) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/admin/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept-Language": locale },
        body: JSON.stringify({
          email: data.email.trim().toLowerCase(),
          password: data.password,
        }),
      },
    ).catch(() => null);
    const json = await response?.json().catch(() => null);
    if (json?.status === "success") {
      setResendIn(Number(json.resendAfterSeconds ?? 60));
      return "sent" as const;
    }
    if (json?.code === "CODE_TOO_SOON") {
      setResendIn(Number(json.retryAfterSeconds ?? 60));
      return "wait" as const;
    }
    if (response?.status === 429) return "throttled" as const;
    if (response?.status === 400) return "credentials" as const;
    return "failed" as const;
  }

  async function submitCredentials(data: TSchema) {
    setFormError("");
    const outcome = await requestCode(data);
    if (outcome === "sent" || outcome === "wait") {
      // A code sent moments ago is still valid: go and enter it.
      setEmail(data.email.trim().toLowerCase());
      setOtp(emptyOtp());
      setOtpError("");
      setView("code");
    } else if (outcome === "credentials") {
      setFormError(t("errors.credentials"));
    } else if (outcome === "throttled") {
      setFormError(tErrors("too_many"));
    } else {
      setFormError(tErrors("generic"));
    }
  }

  // ── Step 2: the emailed code ──────────────────────────────────────────────

  const [otp, setOtp] = useState(emptyOtp);
  const [otpError, setOtpError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function verify(entered?: string | React.SyntheticEvent) {
    // OtpCodeInput passes the code it just completed; the button passes its
    // click event, so fall back to state then.
    const code = typeof entered === "string" ? entered : otp.join("");
    if (code.length < 6 || isVerifying) return;
    setIsVerifying(true);
    setOtpError("");
    const result = await signIn("admin-code", {
      email,
      otp: code,
      redirect: false,
    });
    if (result?.error) {
      setIsVerifying(false);
      setOtp(emptyOtp());
      setOtpError(
        result.code === "CODE_EXPIRED"
          ? t("code.errors.expired")
          : result.code === "TOO_MANY_ATTEMPTS"
            ? tErrors("too_many")
            : t("code.errors.invalid"),
      );
      return;
    }
    window.location.href = `${process.env.NEXT_PUBLIC_ADMIN_URL}/${locale}/analytics`;
  }

  async function resend() {
    if (resendIn > 0 || isResending) return;
    setIsResending(true);
    const outcome = await requestCode({
      email,
      password: getValues("password"),
    });
    setIsResending(false);
    setOtp(emptyOtp());
    if (outcome === "sent") {
      setOtpError("");
      toast.success(t("code.resent"));
    } else if (outcome !== "wait") {
      setOtpError(outcome === "throttled" ? tErrors("too_many") : tErrors("generic"));
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center w-full h-full">
      <AnimatePresence mode="wait" initial={false}>
        {view === "credentials" ? (
          <motion.div key="credentials" {...slide} className="w-full h-full">
            <AuthScreen
              footer={
                <a
                  href={process.env.NEXT_PUBLIC_WEBSITE_URL ?? "https://ticketwaze.com"}
                  className={backPillClass}
                >
                  {tFlow("back")}
                </a>
              }
            >
              <form
                onSubmit={handleSubmit(submitCredentials)}
                noValidate
                className="flex flex-col gap-16 items-center w-full"
              >
                <AuthHeading title={t("title")} description={t("description")} />
                <div className="w-full flex flex-col gap-6">
                  <AuthItem>
                    <Input
                      {...register("email")}
                      type="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      error={errors.email?.message}
                    >
                      {t("placeholders.email")}
                    </Input>
                  </AuthItem>
                  <AuthItem>
                    <PasswordInput
                      {...register("password")}
                      autoComplete="current-password"
                      error={errors.password?.message}
                    >
                      {t("placeholders.password")}
                    </PasswordInput>
                  </AuthItem>
                  <AuthItem className="flex justify-end -mt-4">
                    <Link
                      href="/auth/reset"
                      className="text-[1.5rem] leading-8 text-primary-500 hover:underline"
                    >
                      {t("reset")}
                    </Link>
                  </AuthItem>
                </div>
                <div className="w-full flex flex-col gap-6 items-center">
                  <AuthError message={formError} />
                  <AuthItem>
                    <ButtonPrimary
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-[6rem] active:scale-[0.98]"
                    >
                      {isSubmitting ? <LoadingCircleSmall /> : t("cta")}
                    </ButtonPrimary>
                  </AuthItem>
                  <OrDivider />
                  <AuthItem>
                    <GoogleSignInButton />
                  </AuthItem>
                </div>
              </form>
            </AuthScreen>
          </motion.div>
        ) : (
          <motion.div key="code" {...slide} className="w-full h-full">
            <AuthScreen
              centered
              footer={
                <button
                  type="button"
                  onClick={() => setView("credentials")}
                  className={backPillClass}
                >
                  {tFlow("back")}
                </button>
              }
            >
              <AuthStatus
                image={mail}
                title={t("code.title")}
                description={
                  <>
                    {t("code.description")}{" "}
                    <span className="font-semibold text-deep-100 break-all">
                      {email}
                    </span>
                  </>
                }
              >
                <OtpCodeInput
                  value={otp}
                  onChange={(next) => {
                    setOtp(next);
                    setOtpError("");
                  }}
                  onSubmit={verify}
                  error={otpError}
                />
                <AuthError message={otpError} />
                <ButtonPrimary
                  onClick={verify}
                  disabled={isVerifying || otp.join("").length < 6}
                  className="w-full h-[6rem] active:scale-[0.98]"
                >
                  {isVerifying ? <LoadingCircleSmall /> : t("code.cta")}
                </ButtonPrimary>
                <FooterPill>
                  <FooterPillText>{t("code.resend_text")}</FooterPillText>
                  <button
                    type="button"
                    onClick={resend}
                    disabled={resendIn > 0 || isResending}
                    className={pillActionClass}
                  >
                    {isResending ? (
                      <LoadingCircleSmall />
                    ) : resendIn > 0 ? (
                      t("code.resend_in", { seconds: resendIn })
                    ) : (
                      t("code.resend")
                    )}
                  </button>
                </FooterPill>
              </AuthStatus>
            </AuthScreen>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
