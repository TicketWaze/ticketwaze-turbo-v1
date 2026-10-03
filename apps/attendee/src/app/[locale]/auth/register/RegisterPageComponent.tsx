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
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import US from "@/assets/flags/us.svg";
import FR from "@/assets/flags/fr.svg";
import mail from "@/assets/icons/mail-big.svg";
import successBadge from "@/assets/images/auth/success-badge.png";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Input, PasswordInput } from "@/components/shared/Inputs";
import { ButtonPrimary } from "@/components/shared/buttons";
import GoogleSignInButton from "@/components/shared/GoogleSignInButton";
import { signIn, useSession } from "next-auth/react";
import { deleteReferralCookie } from "@/actions/referral";
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
  SigningIn,
  StepFooter,
  backPillClass,
  pillActionClass,
} from "@/components/auth/AuthParts";
import TermsNote from "@/components/auth/TermsNote";
import OtpCodeInput, { emptyOtp } from "@/components/auth/OtpCodeInput";
import { authHref, safeCallbackPath } from "@/lib/authRedirect";

type RegisterStep = "role" | "register" | "otp" | "verified";

const slide = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.22, ease: "easeInOut" as const },
};

export default function RegisterPageComponent({
  referralCode,
  email,
}: {
  referralCode: string | undefined;
  email: string | undefined;
}) {
  const t = useTranslations("Auth.register");
  const tFlow = useTranslations("Auth.flow");
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();

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

  // Set when sign-up starts from a signed-out prompt (e.g. "Complete
  // Purchase"): the attendee goes straight back there after verifying.
  const callbackUrl = safeCallbackPath(searchParams.get("callbackUrl"));
  const { update } = useSession();

  // A prefilled email (language switch, invite links) lands straight on the
  // form, and so does a prompt sign-up, which is attendee-only, or the
  // organisation app's "Attendee" choice (?role=attendee).
  const roleChosen = searchParams.get("role") === "attendee";
  const [step, setStep] = useState<RegisterStep>(
    email || callbackUrl || roleChosen ? "register" : "role",
  );
  const [splashDone, setSplashDone] = useState(
    Boolean(email) || roleChosen || searchParams.has("start"),
  );
  const [role, setRole] = useState<AuthRole>("attendee");
  const [savedFormData, setSavedFormData] = useState<TRegisterSchema | null>(
    null,
  );

  const [otp, setOtp] = useState(emptyOtp);
  const [otpError, setOtpError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Attendees finish on the "Complete Account Set-up" step (2/2). Organizers
  // never get here: their sign-up lives in the organisation app.
  const nextRoute = "/auth/onboarding";

  function continueWithRole() {
    if (role === "organizer") {
      window.location.href = `${process.env.NEXT_PUBLIC_ORGANISATION_URL}/${locale}/auth/register?role=organizer`;
      return;
    }
    setStep("register");
  }

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
          if (callbackUrl) {
            await finishWithoutSetup(callbackUrl);
          } else {
            router.push(nextRoute);
          }
        }
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
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  }

  /**
   * Prompt sign-ups skip "Complete Account Set-up": the API onboards them with
   * default preferences, we show "Account Verified" and return them to where
   * they were (checkout, an organisation page...). Profile fields can be filled
   * in later from Profile.
   */
  async function finishWithoutSetup(destination: string) {
    setStep("verified");
    try {
      const session = await update();
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/onboarding/user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept-Language": locale,
            Authorization: `Bearer ${session?.user.accessToken}`,
          },
          body: JSON.stringify({}),
        },
      );
      const response = await request.json();
      if (response.status === "success") {
        await update({
          ...session,
          user: {
            ...session?.user,
            isOnboarded: true,
            userPreference: response.userPreference,
          },
        });
        router.push(destination);
        return;
      }
    } catch {}
    // Defaults couldn't be saved: fall back to the regular set-up step.
    router.push(
      `/auth/onboarding?callbackUrl=${encodeURIComponent(destination)}`,
    );
  }

  async function handleResend() {
    if (!savedFormData) return;
    setIsResending(true);
    setOtpError("");
    setOtp(emptyOtp());
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
    const query = email ? `?email=${email}` : "?start";
    router.push(
      `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${newLocale}/auth/register${query}`,
    );
  };

  const signInFooter = (
    <FooterPill>
      <FooterPillText>{t("choice.footer.text")}</FooterPillText>
      <Link
        href={authHref("/auth/login", callbackUrl)}
        className={pillActionClass}
      >
        {t("choice.footer.cta")}
      </Link>
    </FooterPill>
  );

  const referralBanner = (
    <>
      {isLoading && <LoadingCircleSmall />}
      {isInvited && (
        <p className="text-success text-[1.5rem] text-center leading-10">
          <span className="font-semibold">{invitedBy}</span>
          {t("referral")}
        </p>
      )}
    </>
  );

  const otpFilled = otp.join("").length === 6;

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
              onLogin={() => router.push(authHref("/auth/login", callbackUrl))}
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
          {step === "role" && (
            <motion.div key="role" {...slide} className="w-full h-full">
              <AuthScreen footer={signInFooter}>
                <div className="flex flex-col gap-20 items-center">
                  <AuthHeading
                    title={tFlow("role.register_title")}
                    description={tFlow("role.register_description")}
                  />
                  {referralBanner}
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

          {step === "register" && (
            <motion.div key="register" {...slide} className="w-full h-full">
              <AuthScreen
                footer={
                  <StepFooter
                    step={1}
                    total={2}
                    onBack={() => setStep("role")}
                  />
                }
              >
                <form
                  onSubmit={handleSubmit(submitHandler)}
                  className="flex flex-col gap-16 items-center w-full"
                >
                  <AuthHeading
                    title={t("attendee")}
                    description={t("description")}
                  />
                  {referralBanner}
                  <div className="w-full flex flex-col gap-6">
                    {/* App-only: language selector (kept, not in Figma). */}
                    <AuthItem>
                      <Select onValueChange={(e) => switchLocale(e)}>
                        <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] px-8 border-none w-full py-12 text-[1.4rem] text-neutral-700 leading-8">
                          <Image
                            src={locale === "en" ? US : FR}
                            alt=""
                            width={30}
                            height={30}
                          />
                          <span className="text-[1.4rem] leading-8 font-medium text-deep-100">
                            {locale === "en" ? "English" : "Français"}
                          </span>
                        </SelectTrigger>
                        <SelectContent className={"bg-neutral-100"}>
                          <SelectItem
                            className="flex items-center gap-4"
                            value="fr"
                          >
                            <Image src={FR} alt="" width={30} height={30} />
                            <span>Français</span>
                          </SelectItem>
                          <SelectItem
                            className="flex items-center gap-4"
                            value="en"
                          >
                            <Image src={US} alt="" width={30} height={30} />
                            <span>English</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </AuthItem>
                    <AuthItem>
                      <div className="flex gap-6">
                        <Input
                          {...register("firstName")}
                          type="text"
                          className="flex-1"
                          error={errors.firstName?.message}
                        >
                          {t("placeholders.firstname")}
                        </Input>
                        <Input
                          {...register("lastName")}
                          type="text"
                          className="flex-1"
                          error={errors.lastName?.message}
                        >
                          {t("placeholders.lastname")}
                        </Input>
                      </div>
                    </AuthItem>
                    <AuthItem>
                      <Input
                        {...register("email")}
                        type="email"
                        error={errors.email?.message}
                      >
                        {t("placeholders.email")}
                      </Input>
                    </AuthItem>
                    <AuthItem>
                      <PasswordInput
                        t={t}
                        validate={true}
                        {...register("password")}
                      >
                        {t("placeholders.password")}
                      </PasswordInput>
                    </AuthItem>
                    <AuthItem>
                      <PasswordInput
                        error={errors.password_confirmation?.message}
                        {...register("password_confirmation")}
                      >
                        {t("placeholders.confirm")}
                      </PasswordInput>
                    </AuthItem>
                  </div>
                  <div className="w-full flex flex-col gap-8">
                    <AuthItem>
                      <ButtonPrimary
                        disabled={isSubmitting}
                        type={"submit"}
                        className="w-full h-[6rem]"
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
                        referralCode={referralCode}
                        callbackUrl={`${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}${
                          callbackUrl ?? nextRoute
                        }`}
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
                    onClick={() => {
                      setStep("register");
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
                  title={tFlow("verify.title")}
                  description={
                    <>
                      {tFlow("verify.description")}{" "}
                      <span className="font-semibold text-deep-100">
                        {savedFormData?.email}
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
                    disabled={isVerifying || !otpFilled}
                    className="w-full h-[6rem]"
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

          {step === "verified" && (
            <motion.div key="verified" {...slide} className="w-full h-full">
              <AuthScreen centered>
                <AuthStatus
                  image={successBadge}
                  title={tFlow("verified.title")}
                  description={tFlow("verified.description")}
                >
                  <SigningIn />
                </AuthStatus>
              </AuthScreen>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
