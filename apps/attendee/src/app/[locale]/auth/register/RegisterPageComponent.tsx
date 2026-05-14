/* eslint-disable react-hooks/set-state-in-effect */
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
import { motion } from "framer-motion";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Input, PasswordInput } from "@/components/shared/Inputs";
import { ButtonPrimary, ButtonSecondary } from "@/components/shared/buttons";
import GoogleSignInButton from "@/components/shared/GoogleSignInButton";
import { signIn } from "next-auth/react";
import { deleteReferralCookie } from "@/actions/referral";

type RegisterStep = "register" | "otp";

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

  const [step, setStep] = useState<RegisterStep>("register");
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

            {/* OTP boxes */}
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

            {/* Error */}
            {otpError && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-[1.3rem] text-center"
              >
                {otpError}
              </motion.p>
            )}

            {/* Desktop buttons */}
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

        {/* Mobile buttons + back */}
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

  // ── Register form step ─────────────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit(submitHandler)}
      className="flex flex-col items-center justify-between gap-20 w-full h-full pb-4 "
    >
      <div className={"flex flex-col gap-16 w-full"}>
        <div className="flex-1 flex lg:justify-center flex-col w-full pt-18">
          <div className="flex flex-col gap-16 items-center">
            <div className="flex flex-col gap-1 items-center">
              <div className="flex flex-col gap-8 items-center">
                <motion.h3
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="font-medium font-primary text-[3.2rem] leading-14 text-black"
                >
                  {t("organizer")}
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
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
              >
                {isLoading ? <LoadingCircleSmall /> : null}
              </motion.div>
              {isInvited && (
                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.45 }}
                  className="text-success text-[1.5rem] text-center leading-10"
                >
                  <span className="font-semibold">{invitedBy}</span>
                  {t("referral")}
                </motion.p>
              )}
            </div>
            <div className=" w-full flex flex-col gap-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
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
                    <SelectItem className="flex items-center gap-4" value="fr">
                      <Image
                        src={FR}
                        alt={"french flag"}
                        width={30}
                        height={30}
                      />
                      <span>Français</span>
                    </SelectItem>
                    <SelectItem className="flex items-center gap-4" value="en">
                      <Image src={US} alt={"us flag"} width={30} height={30} />
                      <span>English</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
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
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
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
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <PasswordInput t={t} validate={true} {...register("password")}>
                  {t("placeholders.password")}
                </PasswordInput>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
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
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.15 }}
              className=" text-[1.3rem] leading-6 text-neutral-500 text-center"
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
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="w-full hidden lg:flex flex-col gap-8"
            >
              <ButtonPrimary
                disabled={isSubmitting}
                type={"submit"}
                className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <LoadingCircleSmall /> : t("cta.submit")}
              </ButtonPrimary>
              <span className="text-neutral-700 text-center text-[1.8rem] leading-8">
                {t("cta.or")}
              </span>
              <GoogleSignInButton referralCode={referralCode} />
            </motion.div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <ButtonPrimary
            type="submit"
            disabled={isSubmitting}
            className="w-full lg:hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <LoadingCircleSmall /> : t("cta.submit")}
          </ButtonPrimary>
        </motion.div>
        <motion.span
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.05 }}
          className="text-neutral-700 lg:hidden text-center text-[1.8rem] leading-8"
        >
          {t("cta.or")}
        </motion.span>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          className="lg:hidden"
        >
          <GoogleSignInButton referralCode={referralCode} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          className="flex items-center justify-between gap-[1.8rem] border border-neutral-100 p-2 lg:p-4 rounded-[10rem] mb-8"
        >
          <span className="font-normal text-[1.8rem] leading-10 text-center text-neutral-700">
            {t("choice.footer.text")}
          </span>
          <Link
            href={`/auth/login`}
            className="border-2 border-primary-500 px-8 lg:px-12 py-6 rounded-[10rem] font-normal text-primary-500 text-[1.5rem] leading-8 bg-primary-100"
          >
            {t("choice.footer.cta")}
          </Link>
        </motion.div>
      </div>
    </form>
  );
}
