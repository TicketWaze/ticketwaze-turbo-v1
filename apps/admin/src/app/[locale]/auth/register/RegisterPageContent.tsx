"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { motion, AnimatePresence } from "framer-motion";
import { Input, PasswordInput } from "@/components/shared/Inputs";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { LinkAccent } from "@/components/shared/Links";

type Step = "email" | "otp" | "password";

const stepVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.25 } },
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function RegisterPageContent() {
  const t = useTranslations("Auth.register");
  const locale = useLocale();

  const [step, setStep] = useState<Step>("email");
  const [pendingEmail, setPendingEmail] = useState("");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Email step schema — domain validated before sending to API
  const EmailSchema = z.object({
    email: z
      .email(t("email.errors.email"))
      .refine((v) => v.endsWith("@ticketwaze.com"), {
        message: t("email.errors.domain"),
      }),
  });
  type TEmail = z.infer<typeof EmailSchema>;
  const emailForm = useForm<TEmail>({ resolver: zodResolver(EmailSchema) });

  // Password step schema
  const PasswordSchema = z
    .object({
      password: z
        .string()
        .min(8, t("errors.password_length"))
        .refine((p) => /[A-Z]/.test(p))
        .refine((p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p)),
      password_confirmation: z.string(),
    })
    .refine((d) => d.password === d.password_confirmation, {
      message: t("errors.password_match"),
      path: ["password_confirmation"],
    });
  type TPassword = z.infer<typeof PasswordSchema>;
  const passwordForm = useForm<TPassword>({
    resolver: zodResolver(PasswordSchema),
  });

  // 10-minute countdown, restarted each time we enter the OTP step
  useEffect(() => {
    if (step !== "otp") return;
    setSecondsLeft(600);
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  async function submitEmail(data: TEmail) {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/admin/register/email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email }),
        },
      );
      const json = await res.json();
      if (res.status === 429) {
        toast.error(json.message);
      } else if (res.status === 400) {
        emailForm.setError("email", {
          message: t("email.errors.alreadyRegistered"),
        });
      } else if (json.status !== "success") {
        toast.error(json.message || t("errors.failed"));
      } else {
        setPendingEmail(data.email);
        setStep("otp");
      }
    } catch {
      toast.error(t("errors.failed"));
    }
    setIsLoading(false);
  }

  async function resendCode() {
    setIsResending(true);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/admin/register/email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: pendingEmail }),
        },
      );
      setOtpValues(["", "", "", "", "", ""]);
      setOtpError("");
      toast.success(t("otp.resent"));
    } catch {
      toast.error(t("errors.failed"));
    }
    setIsResending(false);
  }

  async function submitOtp() {
    const otp = otpValues.join("");
    if (otp.length < 6) return;
    setIsLoading(true);
    setOtpError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/admin/register/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: pendingEmail, otp }),
        },
      );
      const json = await res.json();
      if (json.status !== "success") {
        setOtpError(t("otp.error"));
        setOtpValues(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      } else {
        setStep("password");
      }
    } catch {
      setOtpError(t("otp.error"));
    }
    setIsLoading(false);
  }

  async function submitPassword(data: TPassword) {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/admin/register/set-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: pendingEmail,
            password: data.password,
            password_confirmation: data.password_confirmation,
          }),
        },
      );
      const json = await res.json();
      if (json.status !== "success") {
        toast.error(json.message || t("errors.failed"));
      } else {
        toast.success(t("password.success"));
        window.location.href = `${process.env.NEXT_PUBLIC_ADMIN_URL}/${locale}/auth/login`;
      }
    } catch {
      toast.error(t("errors.failed"));
    }
    setIsLoading(false);
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otpValues];
    next[index] = value.slice(-1);
    setOtpValues(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtpValues(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  return (
    <div className="flex flex-col items-center justify-between gap-8 h-full pb-4">
      <div className="flex-1 flex lg:justify-center flex-col w-full pt-18">
        <AnimatePresence mode="wait">
          {/* ── Step 1: Email ─────────────────────────────── */}
          {step === "email" && (
            <motion.form
              key="email"
              id="register-email-form"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onSubmit={emailForm.handleSubmit(submitEmail)}
              className="flex flex-col gap-16 items-center"
            >
              <div className="flex flex-col gap-8 items-center">
                <motion.h3
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="font-medium font-primary text-[3.2rem] leading-14 text-black"
                >
                  {t("email.title")}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-[1.8rem] text-center leading-10 text-neutral-700"
                >
                  {t("email.description")}
                </motion.p>
              </div>
              <div className="w-full flex flex-col gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <Input
                    error={emailForm.formState.errors.email?.message}
                    type="email"
                    {...emailForm.register("email")}
                  >
                    {t("email.placeholder")}
                  </Input>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="w-full hidden lg:flex flex-col gap-8"
              >
                <ButtonPrimary
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? <LoadingCircleSmall /> : t("email.cta")}
                </ButtonPrimary>
              </motion.div>
            </motion.form>
          )}

          {/* ── Step 2: OTP ───────────────────────────────── */}
          {step === "otp" && (
            <motion.div
              key="otp"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col gap-16 items-center"
            >
              <div className="flex flex-col gap-8 items-center">
                <h3 className="font-medium font-primary text-[3.2rem] leading-14 text-black">
                  {t("otp.title")}
                </h3>
                <p className="text-[1.8rem] text-center leading-10 text-neutral-700">
                  {t("otp.description")}{" "}
                  <span className="font-semibold text-deep-200">
                    {pendingEmail}
                  </span>
                </p>
              </div>

              <div className="flex flex-col items-center gap-4 w-full">
                <div
                  className="flex gap-3 justify-center"
                  onPaste={handleOtpPaste}
                >
                  {otpValues.map((val, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-[5.2rem] h-[5.6rem] text-center text-[2rem] font-semibold bg-neutral-100 rounded-2xl border border-transparent focus:border-primary-500 outline-none transition-all duration-200 text-deep-200"
                    />
                  ))}
                </div>
                {otpError && (
                  <span className="text-[1.2rem] text-failure">{otpError}</span>
                )}
                <div className="flex items-center gap-4">
                  <span className="text-[1.4rem] text-neutral-600">
                    {t("otp.expiry")} {formatTime(secondsLeft)}
                  </span>
                  {secondsLeft === 0 && (
                    <button
                      type="button"
                      disabled={isResending}
                      onClick={resendCode}
                      className="text-[1.4rem] text-primary-500 hover:underline disabled:opacity-50"
                    >
                      {isResending ? <LoadingCircleSmall /> : t("otp.resend")}
                    </button>
                  )}
                </div>
              </div>

              <div className="w-full hidden lg:flex flex-col gap-4">
                <ButtonPrimary
                  type="button"
                  disabled={isLoading || otpValues.join("").length < 6}
                  onClick={submitOtp}
                  className="w-full"
                >
                  {isLoading ? <LoadingCircleSmall /> : t("otp.cta")}
                </ButtonPrimary>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="text-[1.5rem] text-neutral-500 hover:text-primary-500 transition-colors text-center"
                >
                  {t("otp.back")}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Set Password ──────────────────────── */}
          {step === "password" && (
            <motion.form
              key="password"
              id="register-password-form"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onSubmit={passwordForm.handleSubmit(submitPassword)}
              className="flex flex-col gap-16 items-center"
            >
              <div className="flex flex-col gap-8 items-center">
                <h3 className="font-medium font-primary text-[3.2rem] leading-14 text-black">
                  {t("password.title")}
                </h3>
                <p className="text-[1.8rem] text-center leading-10 text-neutral-700">
                  {t("password.description")}
                </p>
              </div>
              <div className="w-full flex flex-col gap-6">
                <PasswordInput
                  validate={true}
                  t={t}
                  error={passwordForm.formState.errors.password?.message}
                  {...passwordForm.register("password")}
                >
                  {t("password.placeholders.password")}
                </PasswordInput>
                <PasswordInput
                  error={
                    passwordForm.formState.errors.password_confirmation?.message
                  }
                  {...passwordForm.register("password_confirmation")}
                >
                  {t("password.placeholders.confirm")}
                </PasswordInput>
              </div>
              <div className="w-full hidden lg:flex flex-col gap-4">
                <ButtonPrimary
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? <LoadingCircleSmall /> : t("password.cta")}
                </ButtonPrimary>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* ── Mobile sticky footer ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="flex flex-col gap-4 w-full"
      >
        <div className="lg:hidden w-full">
          {step === "email" && (
            <ButtonPrimary
              form="register-email-form"
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <LoadingCircleSmall /> : t("email.cta")}
            </ButtonPrimary>
          )}
          {step === "otp" && (
            <div className="flex flex-col gap-4">
              <ButtonPrimary
                type="button"
                disabled={isLoading || otpValues.join("").length < 6}
                onClick={submitOtp}
                className="w-full"
              >
                {isLoading ? <LoadingCircleSmall /> : t("otp.cta")}
              </ButtonPrimary>
              <button
                type="button"
                onClick={() => setStep("email")}
                className="text-[1.5rem] text-neutral-500 hover:text-primary-500 transition-colors text-center"
              >
                {t("otp.back")}
              </button>
            </div>
          )}
          {step === "password" && (
            <ButtonPrimary
              form="register-password-form"
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <LoadingCircleSmall /> : t("password.cta")}
            </ButtonPrimary>
          )}
        </div>

        {/* Back to login link — only on first step */}
        {step === "email" && (
          <div className="border border-neutral-100 w-full p-4 pl-6 flex items-center justify-between gap-4 lg:gap-[1.8rem] rounded-[100px]">
            <span className="text-[1.8rem] leading-10 text-neutral-700">
              {t("footer.text")}
            </span>
            <LinkAccent href="/auth/login">{t("footer.cta")}</LinkAccent>
          </div>
        )}
      </motion.div>
    </div>
  );
}
