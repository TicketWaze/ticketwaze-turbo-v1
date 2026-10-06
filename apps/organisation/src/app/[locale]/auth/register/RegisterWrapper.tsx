"use client";
import { Link, useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { AnimatePresence, motion } from "motion/react";
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
  StepFooter,
  backPillClass,
  pillActionClass,
} from "@/components/auth/AuthParts";
import TermsNote from "@/components/auth/TermsNote";
import OtpCodeInput, { emptyOtp } from "@/components/auth/OtpCodeInput";
import mail from "@/assets/icons/mail-big.svg";

// Figma "Organizers + Mobile" → Authentication → Sign up: role choice →
// "Organizer Account" (1/2) → "Verify Account" → "Complete Account Set-up"
// (2/2, /auth/onboarding/organisation) → "Account Created". The email is the
// account's login (the organisation's contact email is asked at 2/2). Figma
// verifies by link; the app sends the same 6-digit code as the attendee sign-up.
// "Continue with Google" skips this form and the code: the set-up page asks
// for the organisation name first, then the rest.

type Step = "role" | "form" | "otp";

const slide = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.22, ease: "easeInOut" as const },
};

export default function RegisterWrapper() {
  const t = useTranslations("Auth.register");
  const tFlow = useTranslations("Auth.flow");
  const tLogin = useTranslations("Auth.login");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Coming back from a failed Google sign-up also means the role was chosen.
  const skipRole =
    searchParams.get("role") === "organizer" || searchParams.has("error");
  const [step, setStep] = useState<Step>(skipRole ? "form" : "role");
  const [splashDone, setSplashDone] = useState(
    skipRole || searchParams.has("start"),
  );
  const [role, setRole] = useState<AuthRole>("organizer");

  // A failed Google sign-up comes back here as ?error= (see lib/auth.ts).
  useEffect(() => {
    const error = searchParams.get("error");
    if (!error) return;
    if (error === "organisation_suspended") {
      toast.error(tLogin("errors.organisation_suspended"), { duration: 15000 });
      return;
    }
    toast.error(tLogin("errors.google_failed"), { duration: 8000 });
  }, [searchParams, tLogin]);

  const RegisterSchema = z
    .object({
      firstName: z.string().trim().min(2, t("errors.firstname_length")),
      lastName: z.string().trim().min(2, t("errors.lastname_length")),
      organisationName: z
        .string()
        .trim()
        .min(3, t("errors.organisation_name"))
        .max(30, t("errors.organisation_name")),
      email: z.email(t("errors.email")),
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
  type TRegisterSchema = z.infer<typeof RegisterSchema>;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TRegisterSchema>({ resolver: zodResolver(RegisterSchema) });
  const [saved, setSaved] = useState<TRegisterSchema | null>(null);

  const [otp, setOtp] = useState(emptyOtp);
  const [otpError, setOtpError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function postRegister(data: TRegisterSchema) {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
          Origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: JSON.stringify({ ...data, email: data.email.toLowerCase() }),
      },
    );
    return { ok: request.ok, response: await request.json() };
  }

  async function submitHandler(data: TRegisterSchema) {
    try {
      const { response } = await postRegister(data);
      if (response.status === "success") {
        setSaved(data);
        setOtp(emptyOtp());
        setOtpError("");
        setStep("otp");
      } else if (response.code === "ORGANISATION_NAME_TAKEN") {
        setError("organisationName", {
          message: t("errors.organisation_name_taken"),
        });
      } else if (String(response.message ?? "").includes("already existed")) {
        setError("email", { message: t("errors.exists") });
      } else {
        toast.error(response.message ?? t("errors.generic"));
      }
    } catch {
      toast.error(t("errors.generic"));
    }
  }

  async function handleVerifyOtp(entered?: string | React.SyntheticEvent) {
    // OtpCodeInput passes the code it just completed; the Verify button
    // passes its click event, so fall back to state then.
    const code =
      typeof entered === "string" ? entered : otp.join("");
    if (!saved || code.length < 6 || isVerifying) return;
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
          body: JSON.stringify({ email: saved.email.toLowerCase(), otp: code }),
        },
      );
      const response = await request.json();
      if (response.status !== "success") {
        const msg: string = response.message ?? "";
        setOtpError(
          msg.includes("expired")
            ? t("otp.errors.expired")
            : msg.includes("No verification code")
              ? t("otp.errors.notFound")
              : t("otp.errors.invalid"),
        );
        setIsVerifying(false);
        return;
      }
      const result = await signIn("credentials", {
        email: saved.email.toLowerCase(),
        password: saved.password,
        redirect: false,
      });
      if (result?.error) {
        // Verified, but the session didn't open: signing in by hand finishes it.
        router.push(`/auth/login?email=${encodeURIComponent(saved.email)}`);
        return;
      }
      // Step 2/2 creates the organisation with the name typed here.
      router.push(
        `/auth/onboarding/organisation?name=${encodeURIComponent(saved.organisationName)}`,
      );
    } catch {
      toast.error(t("errors.generic"));
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (!saved || isResending) return;
    setIsResending(true);
    setOtpError("");
    setOtp(emptyOtp());
    try {
      const { response } = await postRegister(saved);
      if (response.status === "success") toast.success(t("otp.sent"));
      else toast.error(response.message ?? t("errors.generic"));
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setIsResending(false);
    }
  }

  function continueWithRole() {
    if (role === "attendee") {
      window.location.href = `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/auth/register?role=attendee`;
      return;
    }
    setStep("form");
  }

  const signInFooter = (
    <FooterPill>
      <FooterPillText>{t("choice.footer.text")}</FooterPillText>
      <Link href="/auth/login?start" className={pillActionClass}>
        {t("choice.footer.cta")}
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
              onCreate={() => setSplashDone(true)}
              onLogin={() => router.push("/auth/login?start")}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div
        key={splashDone ? "app" : "behind-splash"}
        className={`w-full h-full ${splashDone ? "flex" : "hidden lg:flex"}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {step === "role" && (
            <motion.div key="role" {...slide} className="w-full h-full">
              <AuthScreen footer={signInFooter}>
                <div className="flex flex-col gap-20 items-center">
                  <AuthHeading
                    title={tFlow("role.register_title")}
                    description={tFlow("role.register_description")}
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

          {step === "form" && (
            <motion.div key="form" {...slide} className="w-full h-full">
              <AuthScreen
                footer={
                  <StepFooter
                    step={1}
                    total={3}
                    onBack={() => setStep("role")}
                  />
                }
              >
                <form
                  onSubmit={handleSubmit(submitHandler)}
                  noValidate
                  className="flex flex-col gap-16 items-center w-full"
                >
                  <AuthHeading
                    title={t("organizer")}
                    description={t("description")}
                  />
                  <div className="w-full flex flex-col gap-6">
                    <AuthItem>
                      <div className="flex gap-6">
                        <Input
                          {...register("firstName")}
                          autoComplete="given-name"
                          className="flex-1 min-w-0"
                          error={errors.firstName?.message}
                        >
                          {t("placeholders.firstname")}
                        </Input>
                        <Input
                          {...register("lastName")}
                          autoComplete="family-name"
                          className="flex-1 min-w-0"
                          error={errors.lastName?.message}
                        >
                          {t("placeholders.lastname")}
                        </Input>
                      </div>
                    </AuthItem>
                    <AuthItem>
                      <Input
                        {...register("organisationName")}
                        autoComplete="organization"
                        maxLength={30}
                        error={errors.organisationName?.message}
                      >
                        {t("placeholders.organisation_name")}
                      </Input>
                    </AuthItem>
                    <AuthItem>
                      <Input
                        {...register("email")}
                        type="email"
                        autoComplete="email"
                        error={errors.email?.message}
                      >
                        {t("placeholders.email")}
                      </Input>
                    </AuthItem>
                    <AuthItem>
                      <PasswordInput
                        t={t}
                        validate={true}
                        autoComplete="new-password"
                        {...register("password")}
                      >
                        {t("placeholders.password")}
                      </PasswordInput>
                    </AuthItem>
                    <AuthItem>
                      <PasswordInput
                        error={errors.password_confirmation?.message}
                        autoComplete="new-password"
                        {...register("password_confirmation")}
                      >
                        {t("placeholders.confirm")}
                      </PasswordInput>
                    </AuthItem>
                  </div>
                  <div className="w-full flex flex-col gap-8">
                    <AuthItem>
                      <ButtonPrimary
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-[6rem] active:scale-[0.98]"
                      >
                        {isSubmitting ? (
                          <LoadingCircleSmall />
                        ) : (
                          t("cta.submit")
                        )}
                      </ButtonPrimary>
                    </AuthItem>
                    <OrDivider />
                    <AuthItem>
                      <GoogleSignInButton
                        signup
                        callbackUrl={`${process.env.NEXT_PUBLIC_ORGANISATION_URL}/${locale}/auth/onboarding`}
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

          {step === "otp" && (
            <motion.div key="otp" {...slide} className="w-full h-full">
              <AuthScreen
                centered
                footer={
                  <button
                    type="button"
                    onClick={() => setStep("form")}
                    className={backPillClass}
                  >
                    {tFlow("back")}
                  </button>
                }
              >
                <AuthStatus
                  image={mail}
                  title={tFlow("verify.title")}
                  description={
                    <>
                      {tFlow("verify.description")}{" "}
                      <span className="font-semibold text-deep-100">
                        {saved?.email}
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
                    onSubmit={handleVerifyOtp}
                    error={otpError}
                  />
                  <AuthError message={otpError} />
                  <ButtonPrimary
                    onClick={handleVerifyOtp}
                    disabled={isVerifying || otp.join("").length < 6}
                    className="w-full h-[6rem] active:scale-[0.98]"
                  >
                    {isVerifying ? <LoadingCircleSmall /> : t("otp.submit")}
                  </ButtonPrimary>
                  <FooterPill>
                    <FooterPillText>
                      {tFlow("verify.resend_text")}
                    </FooterPillText>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isResending}
                      className={pillActionClass}
                    >
                      {isResending
                        ? t("otp.resending")
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
