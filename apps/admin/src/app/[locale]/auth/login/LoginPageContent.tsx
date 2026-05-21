"use client";
import { Link, useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Input, PasswordInput } from "@/components/shared/Inputs";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { LinkAccent } from "@/components/shared/Links";

type Step = "credentials" | "otp";

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

export default function LoginPageContent() {
  const t = useTranslations("Auth.login");
  const locale = useLocale();
  const [step, setStep] = useState<Step>("credentials");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [isResending, setIsResending] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const LoginSchema = z.object({
    email: z.email(t("errors.email")),
    password: z.string().min(1, t("errors.password")),
  });

  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorMessage = error ? decodeURIComponent(error) : null;
  if (errorMessage) toast.error("AccesDenied");

  type TLoginSchema = z.infer<typeof LoginSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TLoginSchema>({
    resolver: zodResolver(LoginSchema),
  });

  const [isLoading, setIsLoading] = useState(false);

  // OTP countdown — reset whenever we enter the otp step
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

  async function submitCredentials(data: TLoginSchema) {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/admin/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email, password: data.password }),
        },
      );
      const json = await res.json();
      if (json.status !== "success") {
        toast.error(json.message || t("errors.loginFailed"));
      } else {
        setPendingEmail(data.email);
        setPendingPassword(data.password);
        setStep("otp");
      }
    } catch {
      toast.error(t("errors.loginFailed"));
    }
    setIsLoading(false);
  }

  async function submitOtp() {
    const otp = otpValues.join("");
    if (otp.length < 6) return;
    setIsLoading(true);
    const result = await signIn("credentials", {
      email: pendingEmail,
      otp,
      redirect: false,
    });
    if (result?.error) {
      toast.error(t("otp.error"));
      setOtpValues(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } else {
      window.location.href = `${process.env.NEXT_PUBLIC_ADMIN_URL}/${locale}/analytics`;
    }
    setIsLoading(false);
  }

  async function resendOtp() {
    setIsResending(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, password: pendingPassword }),
      });
      setSecondsLeft(600);
      setOtpValues(["", "", "", "", "", ""]);
      toast.success(t("otp.resent"));
    } catch {
      toast.error(t("errors.loginFailed"));
    }
    setIsResending(false);
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

  function goBack() {
    setStep("credentials");
    setOtpValues(["", "", "", "", "", ""]);
  }

  return (
    <div className="flex flex-col items-center justify-between gap-8 h-full pb-4">
      <div className="flex-1 flex lg:justify-center flex-col w-full pt-18">
        <AnimatePresence mode="wait">
          {step === "credentials" ? (
            <motion.form
              key="credentials"
              id="login-form"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onSubmit={handleSubmit(submitCredentials)}
              className="flex flex-col gap-16 items-center"
            >
              <div className="flex flex-col gap-8 items-center">
                <motion.h3
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="font-medium font-primary text-[3.2rem] leading-14 text-black"
                >
                  {t("title")}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-[1.8rem] text-center leading-10 text-neutral-700"
                >
                  {t("description")}
                </motion.p>
              </div>
              <div className="w-full flex flex-col gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
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
                >
                  <PasswordInput
                    error={errors.password?.message}
                    {...register("password")}
                  >
                    {t("placeholders.password")}
                  </PasswordInput>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="flex items-center justify-between"
                >
                  <span />
                  <Link
                    className="text-[1.5rem] leading-8 text-primary-500"
                    href="/auth/reset"
                  >
                    {t("reset")}
                  </Link>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="w-full hidden lg:flex flex-col gap-8"
              >
                <ButtonPrimary
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? <LoadingCircleSmall /> : t("cta.submit")}
                </ButtonPrimary>
              </motion.div>
            </motion.form>
          ) : (
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
                  {t("otp.description")}
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
                <div className="flex items-center gap-4">
                  <span className="text-[1.4rem] text-neutral-600">
                    {t("otp.expiry")} {formatTime(secondsLeft)}
                  </span>
                  {secondsLeft === 0 && (
                    <button
                      type="button"
                      disabled={isResending}
                      onClick={resendOtp}
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
                  onClick={goBack}
                  className="text-[1.5rem] text-neutral-500 hover:text-primary-500 transition-colors text-center"
                >
                  {t("otp.back")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="flex flex-col gap-4 w-full"
      >
        <div className="lg:hidden w-full">
          {step === "credentials" ? (
            <ButtonPrimary
              form="login-form"
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <LoadingCircleSmall /> : t("cta.submit")}
            </ButtonPrimary>
          ) : (
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
                onClick={goBack}
                className="text-[1.5rem] text-neutral-500 hover:text-primary-500 transition-colors text-center"
              >
                {t("otp.back")}
              </button>
            </div>
          )}
        </div>

        {step === "credentials" && (
          <div className="border border-neutral-100 w-full p-4 pl-6 flex items-center justify-between gap-4 lg:gap-[1.8rem] rounded-[100px]">
            <span className="text-[1.8rem] leading-10 text-neutral-700">
              {t("register.text")}
            </span>
            <LinkAccent href="/auth/register">{t("register.cta")}</LinkAccent>
          </div>
        )}
      </motion.div>
    </div>
  );
}
