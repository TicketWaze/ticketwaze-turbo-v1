"use client";
import { Link, useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import US from "@/assets/flags/us.svg";
import FR from "@/assets/flags/fr.svg";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Input, PasswordInput } from "@/components/shared/Inputs";
import { ButtonPrimary, ButtonSecondary } from "@/components/shared/buttons";
import GoogleSignInButton from "@/components/shared/GoogleSignInButton";
import { signIn } from "next-auth/react";
import { deleteReferralCookie } from "@/actions/referral";
import { ArrowLeft2, ArrowRight2, LoginCurve } from "iconsax-reactjs";

type RegisterStep = "choice" | "register" | "otp" | "google";

export default function RegisterPageComponent({
  referralCode,
  email,
}: {
  referralCode: string | undefined;
  email: string | undefined;
}) {
  const t = useTranslations("Auth.register");
  const router = useRouter();
  const locale = useLocale();

  // ── Referral ───────────────────────────────────────────────────────────────

  const [isInvited, setIsInvited] = useState(false);
  const [invitedBy, setInvitedBy] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(
    function () {
      if (referralCode && referralCode !== "") {
        setIsLoading(true);
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/referral/${referralCode}`,
          {
            method: "GET",
            cache: "no-store",
            headers: { "Content-Type": "application/json" },
          },
        )
          .then((r) => r.json())
          .then((data) => {
            if (data.status === "success") {
              setIsInvited(true);
              setInvitedBy(data.fullName);
            } else {
              toast.error("Invalid referral code");
            }
          })
          .finally(() => setIsLoading(false));
      }
    },
    [referralCode],
  );

  // ── Register form ──────────────────────────────────────────────────────────

  const RegisterSchema = z
    .object({
      firstName: z.string().min(2, { error: t("errors.firstname_length") }),
      lastName: z.string().min(2, { error: t("errors.lastname_length") }),
      email: z.string().min(1, { error: t("errors.email") }),
      password: z
        .string()
        .min(8, { message: t("errors.password_length") })
        .refine((p) => /[A-Z]/.test(p))
        .refine((p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p))
        .refine((p) => /[0-9]/.test(p)),
      password_confirmation: z.string(),
    })
    .refine((data) => data.password === data.password_confirmation, {
      message: t("errors.password_match"),
      path: ["password_confirmation"],
    });

  type TRegisterSchema = z.infer<typeof RegisterSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TRegisterSchema>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { email },
  });

  // ── Step & OTP state ───────────────────────────────────────────────────────

  const [step, setStep] = useState<RegisterStep>("choice");
  const [savedFormData, setSavedFormData] = useState<TRegisterSchema | null>(
    null,
  );

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [isOtpExpired, setIsOtpExpired] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function submitHandler(data: TRegisterSchema) {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
          Origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
        body: JSON.stringify(data),
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      setSavedFormData(data);
      setStep("otp");
    } else {
      toast.error(response.message);
    }
  }

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setOtpError("");
    setIsOtpExpired(false);
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
        `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept-Language": locale,
          },
          body: JSON.stringify({
            email: savedFormData!.email,
            otp: otpString,
            ...(referralCode ? { referralCode } : {}),
          }),
        },
      );
      const response = await request.json();
      if (response.status === "success") {
        const result = await signIn("credentials", {
          email: savedFormData!.email,
          password: savedFormData!.password,
          redirect: false,
          callbackUrl: process.env.NEXT_PUBLIC_ATTENDEE_URL,
        });
        if (result?.error) {
          toast.error("Login failed. Please try signing in manually.");
        } else {
          if (referralCode) await deleteReferralCookie();
          router.push("/auth/onboarding");
        }
      } else {
        const msg: string = response.message ?? "";
        if (msg.includes("expired")) {
          setIsOtpExpired(true);
          setOtpError(t("otp.errors.expired"));
        } else if (msg.includes("No verification code")) {
          setIsOtpExpired(true);
          setOtpError(t("otp.errors.notFound"));
        } else {
          setOtpError(t("otp.errors.invalid"));
        }
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (!savedFormData) return;
    setIsResending(true);
    setOtpError("");
    setIsOtpExpired(false);
    setOtp(["", "", "", "", "", ""]);
    otpRefs.current[0]?.focus();
    try {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept-Language": locale,
            Origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
          },
          body: JSON.stringify(savedFormData),
        },
      );
      const response = await request.json();
      if (response.status === "success") {
        toast.success("A new code has been sent to your email.");
      } else {
        toast.error(response.message);
      }
    } catch {
      toast.error("Failed to resend code.");
    } finally {
      setIsResending(false);
    }
  }

  const switchLocale = (newLocale: string) => {
    if (email) {
      router.push(
        `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${newLocale}/auth/register?email=${email}`,
      );
    } else {
      router.push(
        `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${newLocale}/auth/register`,
      );
    }
  };

  const signInFooter = (
    <div className="flex items-center justify-between gap-[1.8rem] border border-neutral-100 p-2 lg:p-4 rounded-[10rem] mb-8">
      <span className="font-normal text-[1.8rem] leading-10 text-center text-neutral-700">
        {t("choice.footer.text")}
      </span>
      <Link
        href={`/auth/login`}
        className="border-2 border-primary-500 px-8 lg:px-12 py-6 rounded-[10rem] font-normal text-primary-500 text-[1.5rem] leading-8 bg-primary-100"
      >
        {t("choice.footer.cta")}
      </Link>
    </div>
  );

  const googleIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );

  // ── OTP step ───────────────────────────────────────────────────────────────

  if (step === "otp") {
    const otpFilled = otp.join("").length === 6;
    return (
      <div className="flex flex-col items-center justify-between gap-20 w-full h-full pb-4">
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
                <span className="font-semibold">{savedFormData?.email}</span>
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
            className="flex items-center justify-between gap-[1.8rem] border border-neutral-100 p-2 lg:p-4 rounded-[10rem] mb-8"
          >
            <span className="font-normal text-[1.8rem] leading-10 text-center text-neutral-700">
              {t("otp.wrong")}
            </span>
            <button
              onClick={() => {
                setStep("register");
                setOtp(["", "", "", "", "", ""]);
                setOtpError("");
                setIsOtpExpired(false);
              }}
              className="border-2 border-primary-500 px-8 lg:px-12 py-6 rounded-[10rem] font-normal text-primary-500 text-[1.5rem] leading-8 bg-primary-100"
            >
              {t("footer")}
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Choice step ────────────────────────────────────────────────────────────

  // ── Google step ────────────────────────────────────────────────────────────

  // ── Register form step ─────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center justify-between gap-20 w-full h-full pb-4">
      <AnimatePresence mode="wait" initial={false}>
        {step === "choice" && (
          <motion.div
            key="choice"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="flex flex-col justify-between w-full h-full gap-20"
          >
            <div className="flex-1 flex justify-center flex-col w-full">
              <div className="flex flex-col gap-16 items-center">
                <div className="flex flex-col gap-8 items-center text-center">
                  <h3 className="font-medium font-primary text-[3.2rem] leading-14 text-black">
                    {t("title")}
                  </h3>
                  <p className="text-[1.8rem] leading-10 text-neutral-700">
                    {t("description")}
                  </p>
                  {isLoading && <LoadingCircleSmall />}
                  {isInvited && (
                    <p className="text-success text-[1.5rem] text-center leading-10">
                      <span className="font-semibold">{invitedBy}</span>
                      {t("referral")}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-4 w-full">
                  <button
                    onClick={() => setStep("google")}
                    className="flex items-center justify-between gap-4 p-[15px] rounded-[15px] border border-neutral-100 hover:border-primary-500 hover:bg-primary-50 transition-all duration-300 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-[44px] h-[44px] rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0">
                        {googleIcon}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                          {t("method.google")}
                        </span>
                        <span className="text-[1.3rem] leading-6 text-neutral-600">
                          {t("method.google_desc")}
                        </span>
                      </div>
                    </div>
                    <ArrowRight2
                      size={20}
                      color="#737C8A"
                      variant="Bulk"
                      className="shrink-0"
                    />
                  </button>

                  <button
                    onClick={() => setStep("register")}
                    className="flex items-center justify-between gap-4 p-[15px] rounded-[15px] border border-neutral-100 hover:border-primary-500 hover:bg-primary-50 transition-all duration-300 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-[44px] h-[44px] rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                        <LoginCurve size={20} color="#E45B00" variant="Bulk" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                          {t("method.credentials")}
                        </span>
                        <span className="text-[1.3rem] leading-6 text-neutral-600">
                          {t("method.credentials_desc")}
                        </span>
                      </div>
                    </div>
                    <ArrowRight2
                      size={20}
                      color="#737C8A"
                      variant="Bulk"
                      className="shrink-0"
                    />
                  </button>
                </div>
              </div>
            </div>
            <div className="w-full">{signInFooter}</div>
          </motion.div>
        )}

        {step === "google" && (
          <motion.div
            key="google"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="flex flex-col justify-between w-full h-full gap-20"
          >
            <div className="flex-1 flex justify-center flex-col w-full">
              <div className="flex flex-col gap-16 items-center">
                <button
                  onClick={() => setStep("choice")}
                  className="flex items-center gap-3 w-fit text-neutral-600 hover:text-primary-500 transition-colors self-start"
                >
                  <ArrowLeft2 size={18} color="#737C8A" variant="Bulk" />
                  <span className="text-[1.5rem] leading-8">
                    {t("method.back")}
                  </span>
                </button>

                <div className="flex flex-col gap-8 items-center text-center">
                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="font-medium font-primary text-[3.2rem] leading-14 text-black"
                  >
                    {t("method.google")}
                  </motion.h3>
                  {/* <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                    className="text-[1.8rem] leading-10 text-neutral-700"
                  >
                    {t("description")}
                  </motion.p> */}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="w-full flex flex-col gap-6"
                >
                  <GoogleSignInButton referralCode={referralCode} />
                  <p className="text-[1.3rem] leading-6 text-neutral-500 text-center">
                    {t("terms.before")}
                    <a
                      href="https://ticketwaze.com/legals"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 hover:underline"
                    >
                      {t("terms.terms")}
                    </a>
                    {t("terms.and")}
                    <a
                      href="https://ticketwaze.com/legals"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 hover:underline"
                    >
                      {t("terms.privacy")}
                    </a>
                  </p>
                </motion.div>
              </div>
            </div>
            <div className="w-full">{signInFooter}</div>
          </motion.div>
        )}

        {step === "register" && (
          <motion.div
            key="register"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="flex flex-col justify-between w-full h-full gap-20"
          >
            <form
              onSubmit={handleSubmit(submitHandler)}
              className="flex flex-col items-center justify-between gap-20 w-full h-full pb-4"
            >
              <div className={"flex flex-col gap-16 w-full"}>
                <div className="flex-1 flex lg:justify-center flex-col w-full pt-18">
                  <div className="flex flex-col gap-16 items-center">
                    <div className="flex flex-col gap-1 items-center w-full">
                      <button
                        type="button"
                        onClick={() => setStep("choice")}
                        className="flex items-center gap-3 w-fit text-neutral-600 hover:text-primary-500 transition-colors self-start mb-8"
                      >
                        <ArrowLeft2 size={18} color="#737C8A" variant="Bulk" />
                        <span className="text-[1.5rem] leading-8">
                          {t("method.back")}
                        </span>
                      </button>

                      <div className="flex flex-col gap-8 items-center">
                        <motion.h3
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                          className="font-medium font-primary text-[3.2rem] leading-14 text-black"
                        >
                          {t("organizer")}
                        </motion.h3>
                        <motion.p
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.15 }}
                          className="text-[1.8rem] text-center leading-10 text-neutral-700"
                        >
                          {t("description")}
                        </motion.p>
                      </div>
                      {isLoading ? <LoadingCircleSmall /> : null}
                      {isInvited && (
                        <motion.p
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.15 }}
                          className="text-success text-[1.5rem] text-center leading-10"
                        >
                          <span className="font-semibold">{invitedBy}</span>
                          {t("referral")}
                        </motion.p>
                      )}
                    </div>
                    <div className="w-full flex flex-col gap-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                      >
                        <Select onValueChange={(e) => switchLocale(e)}>
                          <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] px-8 border-none w-full py-12 text-[1.4rem] text-neutral-700 leading-8">
                            {locale === "en" ? (
                              <>
                                <Image
                                  src={US}
                                  alt={"us flag"}
                                  width={30}
                                  height={30}
                                />
                                <span className="text-[1.4rem] leading-8 font-medium text-deep-100">
                                  English
                                </span>
                              </>
                            ) : (
                              <>
                                <Image
                                  src={FR}
                                  alt={"french flag"}
                                  width={30}
                                  height={30}
                                />
                                <span className="text-[1.4rem] leading-8 font-medium text-deep-100">
                                  Francais
                                </span>
                              </>
                            )}
                          </SelectTrigger>
                          <SelectContent className={"bg-neutral-100"}>
                            <SelectItem
                              className="flex items-center gap-4"
                              value="fr"
                            >
                              <Image
                                src={FR}
                                alt={"french flag"}
                                width={30}
                                height={30}
                              />
                              <span>Français</span>
                            </SelectItem>
                            <SelectItem
                              className="flex items-center gap-4"
                              value="en"
                            >
                              <Image
                                src={US}
                                alt={"us flag"}
                                width={30}
                                height={30}
                              />
                              <span>English</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.25 }}
                        className={"flex gap-6"}
                      >
                        <Input
                          {...register("firstName")}
                          type="text"
                          error={errors.firstName?.message}
                        >
                          {t("placeholders.firstname")}
                        </Input>
                        <Input
                          {...register("lastName")}
                          type="text"
                          error={errors.lastName?.message}
                        >
                          {t("placeholders.lastname")}
                        </Input>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                      >
                        <Input
                          {...register("email")}
                          type="email"
                          error={errors.email?.message}
                        >
                          {t("placeholders.email")}
                        </Input>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.35 }}
                      >
                        <PasswordInput
                          t={t}
                          validate={true}
                          {...register("password")}
                        >
                          {t("placeholders.password")}
                        </PasswordInput>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.4 }}
                      >
                        <PasswordInput
                          error={errors.password_confirmation?.message}
                          {...register("password_confirmation")}
                        >
                          {t("placeholders.confirm")}
                        </PasswordInput>
                      </motion.div>
                    </div>
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.45 }}
                      className="text-[1.3rem] leading-6 text-neutral-500 text-center"
                    >
                      {t("terms.before")}
                      <a
                        href="https://ticketwaze.com/legals"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-500 hover:underline"
                      >
                        {t("terms.terms")}
                      </a>
                      {t("terms.and")}
                      <a
                        href="https://ticketwaze.com/legals"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-500 hover:underline"
                      >
                        {t("terms.privacy")}
                      </a>
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                      className="w-full"
                    >
                      <ButtonPrimary
                        disabled={isSubmitting}
                        type={"submit"}
                        className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <LoadingCircleSmall />
                        ) : (
                          t("cta.submit")
                        )}
                      </ButtonPrimary>
                    </motion.div>
                  </div>
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.55 }}
                className="w-full"
              >
                {signInFooter}
              </motion.div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
