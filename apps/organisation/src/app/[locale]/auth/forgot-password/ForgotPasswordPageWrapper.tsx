"use client";
import { useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { AnimatePresence, motion } from "motion/react";
import { signIn } from "next-auth/react";
import { Input, PasswordInput } from "@/components/shared/Inputs";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
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
import OtpCodeInput, { emptyOtp } from "@/components/auth/OtpCodeInput";

type ResetStep = "email" | "otp" | "password" | "done";

const slide = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.22, ease: "easeInOut" as const },
};

// Figma "Organizers + Mobile" → Authentication → Reset: email (1/2) → mail
// sent → new password (2/2) → "Password Created", signing in. Figma mails a
// link; the app mails a 6-digit code, entered on the mail-sent screen.

export default function ForgotPasswordPageWrapper({
  email: initialEmail,
}: {
  email?: string;
}) {
  const t = useTranslations("Auth.forgot");
  const tPassword = useTranslations("Auth.new_password");
  const tFlow = useTranslations("Auth.flow");
  const router = useRouter();
  const locale = useLocale();

  const [step, setStep] = useState<ResetStep>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  // ── Step 1: email ──────────────────────────────────────────────────────────

  const ForgotPasswordSchema = z.object({
    email: z.string().min(1, { error: t("errors.email") }),
  });
  type TForgotPasswordSchema = z.infer<typeof ForgotPasswordSchema>;
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<TForgotPasswordSchema>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: initialEmail },
  });

  async function submitEmail(data: TForgotPasswordSchema) {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
          Origin: process.env.NEXT_PUBLIC_ORGANISATION_URL ?? "",
        },
        body: JSON.stringify(data),
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      setEmail(data.email);
      setStep("otp");
    } else if (response.status === "warning") {
      // A code was already sent recently; move on so it can be entered.
      toast.info(response.message);
      setEmail(data.email);
      setStep("otp");
    } else {
      toast.error(t("errors.generic"));
    }
  }

  // ── Step 2: OTP (Figma shows a reset-link mail; the app sends a code) ─────

  const [otp, setOtp] = useState(emptyOtp);
  const [otpError, setOtpError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleVerifyOtp(entered?: string | React.SyntheticEvent) {
    // OtpCodeInput passes the code it just completed; the Verify button
    // passes its click event, so fall back to state then.
    const otpString =
      typeof entered === "string" ? entered : otp.join("");
    if (otpString.length < 6 || isVerifying) return;
    setIsVerifying(true);
    setOtpError("");
    try {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept-Language": locale,
          },
          body: JSON.stringify({ email, otp: otpString }),
        },
      );
      const response = await request.json();
      if (response.status === "success" && response.resetToken) {
        setResetToken(response.resetToken);
        setStep("password");
      } else {
        const msg: string = response.message ?? "";
        if (msg.includes("expired")) {
          setOtpError(t("otp.errors.expired"));
        } else if (msg.includes("No verification code")) {
          setOtpError(t("otp.errors.notFound"));
        } else {
          setOtpError(t("otp.errors.invalid"));
        }
      }
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (!email) return;
    setIsResending(true);
    setOtpError("");
    setOtp(emptyOtp());
    try {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept-Language": locale,
            Origin: process.env.NEXT_PUBLIC_ORGANISATION_URL ?? "",
          },
          body: JSON.stringify({ email }),
        },
      );
      const response = await request.json();
      if (response.status === "success") {
        toast.success(t("otp.sent"));
      } else if (response.status === "warning") {
        toast.info(response.message);
      } else {
        toast.error(t("errors.generic"));
      }
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setIsResending(false);
    }
  }

  // ── Step 3: new password ───────────────────────────────────────────────────

  const NewPasswordSchema = z
    .object({
      password: z
        .string()
        .min(8, tPassword("errors.password_length"))
        .refine((password) => /[A-Z]/.test(password))
        .refine((password) =>
          /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
        ),
      password_confirmation: z.string(),
    })
    .refine((data) => data.password === data.password_confirmation, {
      message: tPassword("errors.password_match"),
      path: ["password_confirmation"],
    });
  type TNewPasswordSchema = z.infer<typeof NewPasswordSchema>;
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
  } = useForm<TNewPasswordSchema>({
    resolver: zodResolver(NewPasswordSchema),
  });

  async function submitPassword(data: TNewPasswordSchema) {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/new-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
          Origin: process.env.NEXT_PUBLIC_ORGANISATION_URL ?? "",
          Authorization: `Bearer ${resetToken}`,
        },
        body: JSON.stringify(data),
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      setStep("done");
      await signInWithNewPassword(data.password);
    } else if (response.status === "same") {
      toast.error(tPassword("errors.sameError"));
    } else {
      toast.error(t("errors.generic"));
    }
  }

  // ── Step 4: "Password Created", then sign straight in ──────────────────────

  async function signInWithNewPassword(password: string) {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      // The reset itself succeeded; fall back to the sign-in form.
      toast.success(t("success"));
      router.push(`/auth/login?email=${encodeURIComponent(email)}`);
      return;
    }
    // Onboarding picks the destination: dashboard, invitation or set-up.
    window.location.href = `${process.env.NEXT_PUBLIC_ORGANISATION_URL}/${locale}/auth/onboarding`;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const otpFilled = otp.join("").length === 6;
  const backToLogin = () => router.push("/auth/login?start");

  return (
    <div className="flex flex-col items-center w-full h-full">
      <AnimatePresence mode="wait" initial={false}>
        {step === "email" && (
          <motion.div key="email" {...slide} className="w-full h-full">
            <AuthScreen
              footer={<StepFooter step={1} total={2} onBack={backToLogin} />}
            >
              <form
                onSubmit={handleSubmit(submitEmail)}
                className="flex flex-col gap-16 items-center w-full"
              >
                <AuthHeading
                  title={t("title")}
                  description={t("description")}
                />
                <AuthItem>
                  <Input
                    {...register("email")}
                    type="email"
                    className="w-full"
                    error={errors.email?.message}
                  >
                    {t("placeholders.email")}
                  </Input>
                </AuthItem>
                <AuthItem>
                  <ButtonPrimary
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-[6rem] active:scale-[0.98]"
                  >
                    {isSubmitting ? <LoadingCircleSmall /> : t("cta")}
                  </ButtonPrimary>
                </AuthItem>
              </form>
            </AuthScreen>
          </motion.div>
        )}

        {step === "otp" && (
          <motion.div key="otp" {...slide} className="w-full h-full">
            <AuthScreen
              centered
              footer={
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
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
                title={tFlow("reset_sent.title")}
                description={
                  <>
                    {tFlow("reset_sent.description")}{" "}
                    <span className="font-semibold text-deep-100">{email}</span>
                  </>
                }
              >
                <OtpCodeInput
                  value={otp}
                  onChange={(next) => {
                    setOtp(next);
                    setOtpError("");
                  }}
                  onSubmit={handleVerifyOtp}
                  error={otpError}
                />
                <AuthError message={otpError} />
                <ButtonPrimary
                  onClick={handleVerifyOtp}
                  disabled={isVerifying || !otpFilled}
                  className="w-full h-[6rem] active:scale-[0.98]"
                >
                  {isVerifying ? <LoadingCircleSmall /> : t("otp.submit")}
                </ButtonPrimary>
                <FooterPill>
                  <FooterPillText>{tFlow("verify.resend_text")}</FooterPillText>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className={pillActionClass}
                  >
                    {isResending ? t("otp.resending") : tFlow("verify.resend")}
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
                onSubmit={handlePasswordSubmit(submitPassword)}
                className="flex flex-col gap-16 items-center w-full"
              >
                <AuthHeading
                  title={tPassword("title")}
                  description={tPassword("description")}
                />
                <div className="w-full flex flex-col gap-6">
                  <AuthItem>
                    <PasswordInput
                      t={tPassword}
                      validate={true}
                      {...registerPassword("password")}
                    >
                      {tPassword("placeholders.password")}
                    </PasswordInput>
                  </AuthItem>
                  <AuthItem>
                    <PasswordInput
                      error={passwordErrors.password_confirmation?.message}
                      {...registerPassword("password_confirmation")}
                    >
                      {tPassword("placeholders.confirm")}
                    </PasswordInput>
                  </AuthItem>
                </div>
                <AuthItem>
                  <ButtonPrimary
                    type="submit"
                    disabled={isSubmittingPassword}
                    className="w-full h-[6rem] active:scale-[0.98]"
                  >
                    {isSubmittingPassword ? (
                      <LoadingCircleSmall />
                    ) : (
                      tPassword("cta")
                    )}
                  </ButtonPrimary>
                </AuthItem>
              </form>
            </AuthScreen>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div key="done" {...slide} className="w-full h-full">
            <AuthScreen centered>
              <AuthStatus
                image={successBadge}
                title={tFlow("password_created.title")}
                description={tFlow("password_created.description")}
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
