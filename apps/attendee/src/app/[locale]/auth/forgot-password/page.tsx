"use client";
import { useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { Input, PasswordInput } from "@/components/shared/Inputs";
import { ButtonPrimary, ButtonSecondary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { LinkAccent } from "@/components/shared/Links";

type ResetStep = "email" | "otp" | "password";

export default function ForgotPasswordPage() {
  const t = useTranslations("Auth.forgot");
  const tPassword = useTranslations("Auth.new_password");
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
  });

  async function submitEmail(data: TForgotPasswordSchema) {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
          Origin: process.env.NEXT_PUBLIC_ATTENDEE_URL ?? "",
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

  // ── Step 2: OTP ────────────────────────────────────────────────────────────

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setOtpError("");
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") handleVerifyOtp();
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const digits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const next = ["", "", "", "", "", ""];
    digits.split("").forEach((ch, i) => (next[i] = ch));
    setOtp(next);
    const focusIndex = Math.min(digits.length, 5);
    otpRefs.current[focusIndex]?.focus();
  }

  async function handleVerifyOtp() {
    const otpString = otp.join("");
    if (otpString.length < 6) return;
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
    setOtp(["", "", "", "", "", ""]);
    otpRefs.current[0]?.focus();
    try {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept-Language": locale,
            Origin: process.env.NEXT_PUBLIC_ATTENDEE_URL ?? "",
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
        )
        .refine((password) => /[0-9]/.test(password)),
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
          Origin: process.env.NEXT_PUBLIC_ATTENDEE_URL ?? "",
          Authorization: `Bearer ${resetToken}`,
        },
        body: JSON.stringify(data),
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      toast.success(t("success"));
      router.push("/auth/login");
    } else if (response.status === "same") {
      toast.error(tPassword("errors.sameError"));
    } else {
      toast.error(t("errors.generic"));
    }
  }

  // ── Shared footer ──────────────────────────────────────────────────────────

  const stepNumber = step === "email" ? 1 : step === "otp" ? 2 : 3;
  const footer = (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      className="flex items-center self-center justify-center w-auto gap-[1.8rem] border border-neutral-100 p-6 rounded-[10rem] mb-8"
    >
      <p className="text-[2.2rem] font-normal leading-[3rem] text-center text-neutral-700">
        <span className="text-primary-500">{stepNumber}</span>/3
      </p>
      <LinkAccent href="/auth/login">{t("back")}</LinkAccent>
    </motion.div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  const otpFilled = otp.join("").length === 6;

  return (
    <div className="flex flex-col items-center justify-between w-full h-full pb-4">
      <AnimatePresence mode="wait" initial={false}>
        {step === "email" && (
          <motion.div
            key="email"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="flex flex-col justify-between w-full h-full"
          >
            <form
              onSubmit={handleSubmit(submitEmail)}
              className="flex flex-col items-center h-full pb-4"
            >
              <div className="flex-1 flex lg:justify-center flex-col w-full pt-[4.5rem]">
                <div className="flex flex-col gap-16 items-center">
                  <div className="flex flex-col gap-8 items-center">
                    <motion.h3
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="font-medium font-primary text-[3.2rem] text-center leading-[3.5rem] text-black"
                    >
                      {t("title")}
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="text-[1.8rem] text-center leading-[2.5rem] text-neutral-700"
                    >
                      {t("description")}
                    </motion.p>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="w-full flex flex-col gap-6"
                  >
                    <Input
                      error={errors.email?.message}
                      type="email"
                      {...register("email")}
                    >
                      {t("placeholders.email")}
                    </Input>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="w-full hidden lg:block"
                  >
                    <ButtonPrimary
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? <LoadingCircleSmall /> : t("cta")}
                    </ButtonPrimary>
                  </motion.div>
                </div>
              </div>
              <div className="flex flex-col gap-6 w-full">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="w-full"
                >
                  <ButtonPrimary
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full lg:hidden"
                  >
                    {isSubmitting ? <LoadingCircleSmall /> : t("cta")}
                  </ButtonPrimary>
                </motion.div>
                {footer}
              </div>
            </form>
          </motion.div>
        )}

        {step === "otp" && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="flex flex-col justify-between w-full h-full"
          >
            <div className="flex-1 flex lg:justify-center flex-col w-full pt-18">
              <div className="flex flex-col gap-16 items-center">
                <div className="flex flex-col gap-8 items-center text-center">
                  <motion.h3
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="font-medium font-primary text-[3.2rem] leading-14 text-black"
                  >
                    {t("otp.title")}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-[1.8rem] leading-10 text-neutral-700"
                  >
                    {t("otp.description")}{" "}
                    <span className="font-semibold">{email}</span>
                  </motion.p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="flex gap-4 justify-center"
                >
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      className="w-[5.2rem] h-[5.2rem] text-center text-[2.2rem] font-semibold border-2 border-neutral-200 rounded-[10px] outline-none focus:border-primary-500 transition-colors duration-200 text-deep-100 bg-neutral-50"
                    />
                  ))}
                </motion.div>

                {otpError && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-[1.3rem] text-center"
                  >
                    {otpError}
                  </motion.p>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="w-full hidden lg:flex flex-col gap-6"
                >
                  <ButtonPrimary
                    onClick={handleVerifyOtp}
                    disabled={isVerifying || !otpFilled}
                    className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isVerifying ? <LoadingCircleSmall /> : t("otp.submit")}
                  </ButtonPrimary>
                  <ButtonSecondary
                    onClick={handleResend}
                    disabled={isResending}
                    className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResending ? t("otp.resending") : t("otp.resend")}
                  </ButtonSecondary>
                </motion.div>
              </div>
            </div>

            <div className="flex flex-col gap-6 w-full">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex flex-col gap-4 lg:hidden"
              >
                <ButtonPrimary
                  onClick={handleVerifyOtp}
                  disabled={isVerifying || !otpFilled}
                  className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? <LoadingCircleSmall /> : t("otp.submit")}
                </ButtonPrimary>
                <ButtonSecondary
                  onClick={handleResend}
                  disabled={isResending}
                  className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? t("otp.resending") : t("otp.resend")}
                </ButtonSecondary>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="flex items-center self-center justify-center w-auto gap-[1.8rem] border border-neutral-100 p-6 rounded-[10rem] mb-8"
              >
                <p className="text-[2.2rem] font-normal leading-[3rem] text-center text-neutral-700">
                  <span className="text-primary-500">2</span>/3
                </p>
                <button
                  onClick={() => {
                    setStep("email");
                    setOtp(["", "", "", "", "", ""]);
                    setOtpError("");
                  }}
                  className="font-normal text-[1.4rem] leading-[25px] text-center text-primary-500"
                >
                  {t("otp.wrong")}
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {step === "password" && (
          <motion.div
            key="password"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="flex flex-col justify-between w-full h-full"
          >
            <form
              onSubmit={handlePasswordSubmit(submitPassword)}
              className="flex flex-col items-center h-full pb-4"
            >
              <div className="flex-1 flex lg:justify-center flex-col w-full pt-18">
                <div className="flex flex-col gap-16 items-center">
                  <div className="flex flex-col gap-8 items-center">
                    <motion.h3
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="font-medium font-primary text-[3.2rem] leading-14 text-black"
                    >
                      {tPassword("title")}
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="text-[1.8rem] text-center leading-10 text-neutral-700"
                    >
                      {tPassword("description")}
                    </motion.p>
                  </div>
                  <div className="w-full flex flex-col gap-6">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      <PasswordInput
                        error={passwordErrors.password?.message}
                        validate={true}
                        t={tPassword}
                        {...registerPassword("password")}
                      >
                        {tPassword("placeholders.password")}
                      </PasswordInput>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                    >
                      <PasswordInput
                        error={passwordErrors.password_confirmation?.message}
                        {...registerPassword("password_confirmation")}
                      >
                        {tPassword("placeholders.confirm")}
                      </PasswordInput>
                    </motion.div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="w-full hidden lg:block"
                  >
                    <ButtonPrimary
                      type="submit"
                      disabled={isSubmittingPassword}
                      className="w-full"
                    >
                      {isSubmittingPassword ? (
                        <LoadingCircleSmall />
                      ) : (
                        tPassword("cta")
                      )}
                    </ButtonPrimary>
                  </motion.div>
                </div>
              </div>
              <div className="flex flex-col gap-6 w-full">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="w-full"
                >
                  <ButtonPrimary
                    type="submit"
                    disabled={isSubmittingPassword}
                    className="w-full lg:hidden"
                  >
                    {isSubmittingPassword ? (
                      <LoadingCircleSmall />
                    ) : (
                      tPassword("cta")
                    )}
                  </ButtonPrimary>
                </motion.div>
                {footer}
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
