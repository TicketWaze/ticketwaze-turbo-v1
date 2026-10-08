"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { AnimatePresence, motion } from "motion/react";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Input, PasswordInput } from "@/components/shared/Inputs";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import OtpCodeInput, { emptyOtp } from "@/components/auth/OtpCodeInput";
import mail from "@/assets/icons/mail-big.svg";
import successBadge from "@/assets/images/auth/success-badge.png";
import {
  AuthError,
  AuthHeading,
  AuthItem,
  AuthScreen,
  AuthStatus,
  FooterPill,
  FooterPillText,
  SigningIn,
  StepFooter,
  backPillClass,
  pillActionClass,
} from "@/components/auth/AuthParts";

type Step = "email" | "code" | "password" | "done";

const slide = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.22, ease: "easeInOut" as const },
};

/**
 * Figma "Admin" → Authentication → Reset: email (1/2) → mail sent →
 * Create Password (2/2) → "Password Created", signing you in. Figma mails a
 * link; the API mails a 6-digit code, entered on the mail-sent screen.
 */
export default function ResetPageContent() {
  const t = useTranslations("Auth.reset");
  const tFlow = useTranslations("Auth.flow");
  const tErrors = useTranslations("Auth.errors");
  const tLogin = useTranslations("Auth.login");
  const locale = useLocale();
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  /**
   * POST /auth/admin/forgot-password. The answer is the same whether or not
   * the address is an admin (no enumeration), so any success moves on.
   */
  async function sendCode(address: string) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/admin/forgot-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept-Language": locale },
        body: JSON.stringify({ email: address }),
      },
    ).catch(() => null);
    if (response?.status === 429) return "throttled" as const;
    const json = await response?.json().catch(() => null);
    if (json?.status !== "success") return "failed" as const;
    setResendIn(Number(json.resendAfterSeconds ?? 60));
    return "sent" as const;
  }

  // ── Step 1: email ──────────────────────────────────────────────────────────

  const EmailSchema = z.object({ email: z.email(t("errors.email")) });
  type TEmail = z.infer<typeof EmailSchema>;
  const emailForm = useForm<TEmail>({ resolver: zodResolver(EmailSchema) });
  const [emailError, setEmailError] = useState("");

  async function submitEmail(data: TEmail) {
    setEmailError("");
    const address = data.email.trim().toLowerCase();
    const outcome = await sendCode(address);
    if (outcome === "sent") {
      setEmail(address);
      setOtp(emptyOtp());
      setOtpError("");
      setStep("code");
    } else {
      setEmailError(outcome === "throttled" ? tErrors("too_many") : tErrors("generic"));
    }
  }

  // ── Step 2: the emailed code ───────────────────────────────────────────────

  const [otp, setOtp] = useState(emptyOtp);
  const [otpError, setOtpError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function verify(entered?: string | React.SyntheticEvent) {
    const code = typeof entered === "string" ? entered : otp.join("");
    if (code.length < 6 || isVerifying) return;
    setIsVerifying(true);
    setOtpError("");
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/admin/forgot-password/verify-otp`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept-Language": locale },
        body: JSON.stringify({ email, otp: code }),
      },
    ).catch(() => null);
    const json = await response?.json().catch(() => null);
    setIsVerifying(false);
    if (json?.status === "success" && json.resetToken) {
      setResetToken(json.resetToken);
      setStep("password");
      return;
    }
    setOtp(emptyOtp());
    setOtpError(
      response?.status === 429
        ? tErrors("too_many")
        : json?.code === "CODE_EXPIRED"
          ? t("sent.errors.expired")
          : t("sent.errors.invalid"),
    );
  }

  async function resend() {
    if (resendIn > 0 || isResending) return;
    setIsResending(true);
    const outcome = await sendCode(email);
    setIsResending(false);
    setOtp(emptyOtp());
    if (outcome === "sent") {
      setOtpError("");
      toast.success(t("sent.resent"));
    } else {
      setOtpError(outcome === "throttled" ? tErrors("too_many") : tErrors("generic"));
    }
  }

  // ── Step 3: new password, then signed straight in ──────────────────────────

  const PasswordSchema = z
    .object({
      password: z
        .string()
        .min(8, t("password.errors.password"))
        .refine((p) => /[A-Z]/.test(p), t("password.errors.password"))
        .refine(
          (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
          t("password.errors.password"),
        )
        .refine((p) => /[0-9]/.test(p), t("password.errors.password")),
      password_confirmation: z.string(),
    })
    .refine((d) => d.password === d.password_confirmation, {
      message: t("password.errors.password_match"),
      path: ["password_confirmation"],
    });
  type TPassword = z.infer<typeof PasswordSchema>;
  const passwordForm = useForm<TPassword>({
    resolver: zodResolver(PasswordSchema),
  });
  const [passwordError, setPasswordError] = useState("");

  async function submitPassword(data: TPassword) {
    setPasswordError("");
    const result = await signIn("admin-reset", {
      email,
      resetToken,
      password: data.password,
      password_confirmation: data.password_confirmation,
      redirect: false,
    });
    if (result?.error) {
      if (result.code === "SAME_PASSWORD") {
        setPasswordError(t("password.errors.same"));
      } else if (result.code === "RESET_EXPIRED") {
        toast.error(t("password.errors.expired"));
        setStep("email");
      } else if (result.code === "TOO_MANY_ATTEMPTS") {
        setPasswordError(tErrors("too_many"));
      } else {
        setPasswordError(tErrors("generic"));
      }
      return;
    }
    setStep("done");
    setTimeout(() => {
      window.location.href = `${process.env.NEXT_PUBLIC_ADMIN_URL}/${locale}/analytics`;
    }, 1600);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center w-full h-full">
      <AnimatePresence mode="wait" initial={false}>
        {step === "email" && (
          <motion.div key="email" {...slide} className="w-full h-full">
            <AuthScreen
              footer={
                <StepFooter
                  step={1}
                  total={2}
                  onBack={() => router.push("/auth/login")}
                />
              }
            >
              <form
                onSubmit={emailForm.handleSubmit(submitEmail)}
                noValidate
                className="flex flex-col gap-16 items-center w-full"
              >
                <AuthHeading title={t("title")} description={t("description")} />
                <AuthItem>
                  <Input
                    {...emailForm.register("email")}
                    type="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    error={emailForm.formState.errors.email?.message}
                  >
                    {t("placeholders.email")}
                  </Input>
                </AuthItem>
                <div className="w-full flex flex-col gap-6 items-center">
                  <AuthError message={emailError} />
                  <AuthItem>
                    <ButtonPrimary
                      type="submit"
                      disabled={emailForm.formState.isSubmitting}
                      className="w-full h-[6rem] active:scale-[0.98]"
                    >
                      {emailForm.formState.isSubmitting ? (
                        <LoadingCircleSmall />
                      ) : (
                        t("cta")
                      )}
                    </ButtonPrimary>
                  </AuthItem>
                </div>
              </form>
            </AuthScreen>
          </motion.div>
        )}

        {step === "code" && (
          <motion.div key="code" {...slide} className="w-full h-full">
            <AuthScreen
              centered
              footer={
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className={backPillClass}
                >
                  {tFlow("back")}
                </button>
              }
            >
              <AuthStatus
                image={mail}
                title={t("sent.title")}
                description={
                  <>
                    {t("sent.description")}{" "}
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
                  {isVerifying ? <LoadingCircleSmall /> : t("sent.cta")}
                </ButtonPrimary>
                <FooterPill>
                  <FooterPillText>{t("sent.resend_text")}</FooterPillText>
                  <button
                    type="button"
                    onClick={resend}
                    disabled={resendIn > 0 || isResending}
                    className={pillActionClass}
                  >
                    {isResending ? (
                      <LoadingCircleSmall />
                    ) : resendIn > 0 ? (
                      tLogin("code.resend_in", { seconds: resendIn })
                    ) : (
                      t("sent.resend")
                    )}
                  </button>
                </FooterPill>
              </AuthStatus>
            </AuthScreen>
          </motion.div>
        )}

        {step === "password" && (
          <motion.div key="password" {...slide} className="w-full h-full">
            <AuthScreen footer={<StepFooter step={2} total={2} />}>
              <form
                onSubmit={passwordForm.handleSubmit(submitPassword)}
                noValidate
                className="flex flex-col gap-16 items-center w-full"
              >
                <AuthHeading
                  title={t("password.title")}
                  description={t("password.description")}
                />
                <div className="w-full flex flex-col gap-6">
                  <AuthItem>
                    <PasswordInput
                      {...passwordForm.register("password")}
                      autoComplete="new-password"
                      validate
                      t={(key: string) => t(`password.${key}` as never)}
                      error={passwordForm.formState.errors.password?.message}
                    >
                      {t("password.placeholders.password")}
                    </PasswordInput>
                  </AuthItem>
                  <AuthItem>
                    <PasswordInput
                      {...passwordForm.register("password_confirmation")}
                      autoComplete="new-password"
                      error={
                        passwordForm.formState.errors.password_confirmation?.message
                      }
                    >
                      {t("password.placeholders.confirm")}
                    </PasswordInput>
                  </AuthItem>
                </div>
                <div className="w-full flex flex-col gap-6 items-center">
                  <AuthError message={passwordError} />
                  <AuthItem>
                    <ButtonPrimary
                      type="submit"
                      disabled={passwordForm.formState.isSubmitting}
                      className="w-full h-[6rem] active:scale-[0.98]"
                    >
                      {passwordForm.formState.isSubmitting ? (
                        <LoadingCircleSmall />
                      ) : (
                        t("password.cta")
                      )}
                    </ButtonPrimary>
                  </AuthItem>
                </div>
              </form>
            </AuthScreen>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div key="done" {...slide} className="w-full h-full">
            <AuthScreen centered>
              <AuthStatus
                image={successBadge}
                title={t("done.title")}
                description={t("done.description")}
              >
                <SigningIn />
              </AuthStatus>
            </AuthScreen>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
