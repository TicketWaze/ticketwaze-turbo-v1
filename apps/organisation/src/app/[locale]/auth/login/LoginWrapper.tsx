"use client";
import { Link, useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { safeNextPath, withNext } from "@/lib/nextPath";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { AnimatePresence, motion } from "motion/react";
import { readMfaCode, type MfaChallenge } from "@ticketwaze/auth/mfa";
import { Input, PasswordInput } from "@/components/shared/Inputs";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import GoogleSignInButton from "@/components/shared/GoogleSignInButton";
import {
  AuthError,
  AuthHeading,
  AuthItem,
  AuthRole,
  AuthScreen,
  AuthSplash,
  AuthStatus,
  FooterPill,
  FooterPillText,
  OrDivider,
  RoleCards,
  backPillClass,
  pillActionClass,
} from "@/components/auth/AuthParts";
import TermsNote from "@/components/auth/TermsNote";
import OtpCodeInput, { emptyOtp } from "@/components/auth/OtpCodeInput";
import mail from "@/assets/icons/mail-big.svg";
import { ResendLoginCodeAction } from "@/actions/mfaActions";

// Figma "Organizers + Mobile" → Authentication → Sign in: "Welcome back" role
// choice, then the "Organizer Account" form. The emailed 2FA code step and the
// terms line are app-only.

type View = "role" | "credentials" | "code";

const slide = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.22, ease: "easeInOut" as const },
};

export default function LoginWrapper() {
  const t = useTranslations("Auth.login");
  const tFlow = useTranslations("Auth.flow");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? undefined;
  // Where to go once signed in (an emailed link, e.g. "Verify my
  // organisation"); onboarding lands there instead of the dashboard.
  const next = safeNextPath(searchParams.get("next"));
  // Arriving from the attendee app's "Organizer" choice, from a link that
  // already names the account, or headed for a dashboard page means the role
  // was chosen: go to the form.
  const skipRole =
    Boolean(email) || Boolean(next) || searchParams.get("role") === "organizer";
  const [view, setView] = useState<View>(skipRole ? "credentials" : "role");
  const [splashDone, setSplashDone] = useState(
    skipRole || searchParams.has("start"),
  );
  const [role, setRole] = useState<AuthRole>("organizer");

  const LoginSchema = z.object({
    email: z.email(t("errors.email")),
    password: z.string().min(1, t("errors.password")),
  });
  type TLoginSchema = z.infer<typeof LoginSchema>;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TLoginSchema>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email },
  });
  const [isLoading, setIsloading] = useState(false);
  const { update } = useSession();

  // The google redirect flow surfaces auth failures as a ?error= param on
  // this page rather than an inline toast. (A Google account without a
  // Ticketwaze account is not one: it gets an account and goes to set-up.) Our own codes are translated; anything
  // else is an Auth.js code like `AccessDenied` or `Configuration`, which is
  // meaningless to a user, so it degrades to the generic message.
  useEffect(() => {
    const error = searchParams.get("error");
    if (!error) return;
    // A suspension is not a sign-in failure to be retried, so it gets a longer
    // notice than the codes around it.
    if (error === "organisation_suspended") {
      toast.error(t("errors.organisation_suspended"), { duration: 15000 });
      return;
    }
    toast.error(t("errors.google_failed"), { duration: 8000 });
  }, [searchParams, t]);

  // Email 2FA: the challenge the API answered with, and the code step state.
  const [challenge, setChallenge] = useState<MfaChallenge | null>(null);
  const [otp, setOtp] = useState(emptyOtp);
  const [otpError, setOtpError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  function mfaMessage(reason: string, attemptsLeft?: number) {
    if (reason === "INVALID_CODE")
      return attemptsLeft
        ? t("mfa.errors.invalid_left", { count: attemptsLeft })
        : t("mfa.errors.invalid");
    if (reason === "CODE_EXPIRED") return t("mfa.errors.expired");
    if (reason === "TOO_MANY_ATTEMPTS") return t("mfa.errors.too_many");
    return t("mfa.errors.restart");
  }

  // Shared by both ways in: password alone, or password then emailed code.
  // Onboarding decides where to go: dashboard, invitation, set-up or suspended.
  async function afterSignIn() {
    const session = await update();
    const lang = session?.user?.userPreference?.appLanguage ?? locale;
    window.location.assign(
      `${process.env.NEXT_PUBLIC_ORGANISATION_URL}/${lang}${withNext("/auth/onboarding", next)}`,
    );
  }

  async function submitHandler(data: TLoginSchema) {
    setIsloading(true);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
      callbackUrl: process.env.NEXT_PUBLIC_ORGANISATION_URL,
    });
    if (result?.error) {
      // `code` carries our own reason out of `authorize`; `error` alone is the
      // generic CredentialsSignin that every failure shares.
      const mfa = readMfaCode(result.code);
      if (mfa?.kind === "challenge") {
        setChallenge(mfa.challenge);
        setOtp(emptyOtp());
        setOtpError("");
        setResendIn(mfa.challenge.resendAfterSeconds);
        setView("code");
      } else if (result.code === "organisation_suspended") {
        toast.error(t("errors.organisation_suspended"), { duration: 15000 });
      } else {
        toast.error(t("errors.wrong"));
      }
      setIsloading(false);
      return;
    }
    await afterSignIn();
  }

  async function handleVerifyCode(entered?: string | React.SyntheticEvent) {
    // OtpCodeInput passes the code it just completed; the Verify button
    // passes its click event, so fall back to state then.
    const code =
      typeof entered === "string" ? entered : otp.join("");
    if (!challenge || code.length < 6 || isVerifying) return;
    setIsVerifying(true);
    const result = await signIn("credentials", {
      challengeId: challenge.challengeId,
      code,
      redirect: false,
    });
    if (result?.error) {
      const mfa = readMfaCode(result.code);
      const reason = mfa?.kind === "failure" ? mfa.reason : "INVALID_CODE";
      setOtpError(
        mfaMessage(
          reason,
          mfa?.kind === "failure" ? mfa.attemptsLeft : undefined,
        ),
      );
      setOtp(emptyOtp());
      setIsVerifying(false);
      return;
    }
    await afterSignIn();
  }

  async function handleResendCode() {
    if (!challenge || resendIn > 0 || isResending) return;
    setIsResending(true);
    const result = await ResendLoginCodeAction(challenge.challengeId);
    setIsResending(false);
    if (result.ok) {
      toast.success(t("mfa.resent"));
      setOtp(emptyOtp());
      setOtpError("");
      setResendIn(result.resendAfterSeconds);
    } else if (result.code === "RESEND_TOO_SOON") {
      setResendIn(result.retryAfterSeconds ?? 60);
    } else {
      setOtpError(mfaMessage(result.code));
    }
  }

  function continueWithRole() {
    if (role === "attendee") {
      window.location.href = `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/auth/login?role=attendee`;
      return;
    }
    setView("credentials");
  }

  const signUpFooter = (
    <FooterPill>
      <FooterPillText>{t("footer.text")}</FooterPillText>
      <Link href="/auth/register" className={pillActionClass}>
        {t("footer.cta")}
      </Link>
    </FooterPill>
  );

  return (
    <div className="flex flex-col items-center h-full">
      <AnimatePresence mode="popLayout" initial={false}>
        {!splashDone && (
          <motion.div
            key="splash"
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden w-full h-full"
          >
            <AuthSplash
              onCreate={() => router.push("/auth/register?start")}
              onLogin={() => setSplashDone(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Keyed so the screen replays its entrance once the splash is dismissed. */}
      <div
        key={splashDone ? "app" : "behind-splash"}
        className={`w-full h-full ${splashDone ? "flex" : "hidden lg:flex"}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {view === "role" && (
            <motion.div key="role" {...slide} className="w-full h-full">
              <AuthScreen footer={signUpFooter}>
                <div className="flex flex-col gap-20 items-center">
                  <AuthHeading
                    title={tFlow("role.login_title")}
                    description={tFlow("role.login_description")}
                  />
                  <RoleCards value={role} onChange={setRole} />
                  <AuthItem>
                    <ButtonPrimary
                      onClick={continueWithRole}
                      className="w-full h-[6rem] active:scale-[0.98]"
                    >
                      {tFlow("role.continue")}
                    </ButtonPrimary>
                  </AuthItem>
                </div>
              </AuthScreen>
            </motion.div>
          )}

          {view === "credentials" && (
            <motion.div key="credentials" {...slide} className="w-full h-full">
              <AuthScreen
                footer={
                  <button
                    type="button"
                    onClick={() => setView("role")}
                    className={backPillClass}
                  >
                    {tFlow("back")}
                  </button>
                }
              >
                <form
                  onSubmit={handleSubmit(submitHandler)}
                  className="flex flex-col gap-16 items-center w-full"
                >
                  <AuthHeading
                    title={t("organizer_title")}
                    description={t("description")}
                  />
                  <div className="w-full flex flex-col gap-6">
                    <AuthItem>
                      <Input
                        error={errors.email?.message}
                        type="email"
                        autoComplete="email"
                        {...register("email")}
                      >
                        {t("placeholders.email")}
                      </Input>
                    </AuthItem>
                    <AuthItem>
                      <PasswordInput
                        error={errors.password?.message}
                        autoComplete="current-password"
                        {...register("password")}
                      >
                        {t("placeholders.password")}
                      </PasswordInput>
                    </AuthItem>
                    <AuthItem className="flex justify-end">
                      <Link
                        className="text-[1.5rem] leading-8 text-primary-500 hover:underline"
                        href="/auth/forgot-password"
                      >
                        {t("reset")}
                      </Link>
                    </AuthItem>
                  </div>
                  <div className="w-full flex flex-col gap-8">
                    <AuthItem>
                      <ButtonPrimary
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-[6rem] active:scale-[0.98]"
                      >
                        {isLoading ? <LoadingCircleSmall /> : t("cta.submit")}
                      </ButtonPrimary>
                    </AuthItem>
                    <OrDivider />
                    <AuthItem>
                      <GoogleSignInButton
                        callbackUrl={`${process.env.NEXT_PUBLIC_ORGANISATION_URL}/${locale}${withNext("/auth/onboarding", next)}`}
                      />
                    </AuthItem>
                    <AuthItem>
                      <TermsNote />
                    </AuthItem>
                  </div>
                </form>
              </AuthScreen>
            </motion.div>
          )}

          {view === "code" && challenge && (
            <motion.div key="code" {...slide} className="w-full h-full">
              <AuthScreen
                centered
                footer={
                  <button
                    type="button"
                    onClick={() => {
                      setView("credentials");
                      setChallenge(null);
                      setOtp(emptyOtp());
                      setOtpError("");
                    }}
                    className={backPillClass}
                  >
                    {tFlow("back")}
                  </button>
                }
              >
                <AuthStatus
                  image={mail}
                  title={t("mfa.title")}
                  description={
                    <>
                      {t("mfa.description")}{" "}
                      <span className="font-semibold text-deep-100">
                        {challenge.email}
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
                    onSubmit={handleVerifyCode}
                    error={otpError}
                  />
                  <AuthError message={otpError} />
                  <ButtonPrimary
                    onClick={handleVerifyCode}
                    disabled={isVerifying || otp.join("").length < 6}
                    className="w-full h-[6rem] active:scale-[0.98]"
                  >
                    {isVerifying ? <LoadingCircleSmall /> : t("mfa.submit")}
                  </ButtonPrimary>
                  <FooterPill>
                    <FooterPillText>
                      {tFlow("verify.resend_text")}
                    </FooterPillText>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isResending || resendIn > 0}
                      className={`${pillActionClass} disabled:opacity-60`}
                    >
                      {resendIn > 0
                        ? t("mfa.resend_in", { seconds: resendIn })
                        : tFlow("verify.resend")}
                    </button>
                  </FooterPill>
                </AuthStatus>
              </AuthScreen>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
