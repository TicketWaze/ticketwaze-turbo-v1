"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "motion/react";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { ArrowLeft2 } from "iconsax-reactjs";
import { readMfaCode, type MfaChallenge } from "@ticketwaze/auth/mfa";
import { ButtonPrimary, ButtonSecondary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { ResendLoginCodeAction } from "@/actions/mfaActions";

const LENGTH = 6;
const empty = () => Array<string>(LENGTH).fill("");

/**
 * Email 2FA, second step of the dashboard login: six boxes for the emailed
 * code. Signs in with `{ challengeId, code }`; `onSignedIn` runs the same
 * hand-off as a plain password login.
 */
export default function MfaCodeStep({
  challenge,
  onBack,
  onSignedIn,
}: {
  challenge: MfaChallenge;
  onBack: () => void;
  onSignedIn: () => Promise<void>;
}) {
  const t = useTranslations("Auth.login.mfa");
  const [otp, setOtp] = useState(empty);
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendIn, setResendIn] = useState(challenge.resendAfterSeconds);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const shake = useAnimationControls();

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  function message(reason: string, attemptsLeft?: number) {
    if (reason === "INVALID_CODE")
      return attemptsLeft
        ? t("errors.invalid_left", { count: attemptsLeft })
        : t("errors.invalid");
    if (reason === "CODE_EXPIRED") return t("errors.expired");
    if (reason === "TOO_MANY_ATTEMPTS") return t("errors.too_many");
    return t("errors.restart");
  }

  function fail(text: string) {
    setError(text);
    setOtp(empty());
    refs.current[0]?.focus();
    void shake.start({
      x: [0, -10, 10, -6, 6, 0],
      transition: { duration: 0.4 },
    });
  }

  async function verify(code = otp.join("")) {
    if (code.length < LENGTH || isVerifying) return;
    setIsVerifying(true);
    const result = await signIn("credentials", {
      challengeId: challenge.challengeId,
      code,
      redirect: false,
    });
    if (result?.error) {
      const mfa = readMfaCode(result.code);
      fail(
        mfa?.kind === "failure"
          ? message(mfa.reason, mfa.attemptsLeft)
          : message("INVALID_CODE"),
      );
      setIsVerifying(false);
      return;
    }
    await onSignedIn();
    setIsVerifying(false);
  }

  async function resend() {
    if (resendIn > 0 || isResending) return;
    setIsResending(true);
    const result = await ResendLoginCodeAction(challenge.challengeId);
    setIsResending(false);
    if (result.ok) {
      toast.success(t("resent"));
      setError("");
      setOtp(empty());
      setResendIn(result.resendAfterSeconds);
    } else if (result.code === "RESEND_TOO_SOON") {
      setResendIn(result.retryAfterSeconds ?? 60);
    } else {
      fail(message(result.code));
    }
  }

  function change(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError("");
    if (digit && index < LENGTH - 1) refs.current[index + 1]?.focus();
    if (digit && next.every(Boolean)) void verify(next.join(""));
  }

  function paste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const digits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, LENGTH);
    const next = empty();
    digits.split("").forEach((d, i) => (next[i] = d));
    setOtp(next);
    refs.current[Math.min(digits.length, LENGTH - 1)]?.focus();
    if (digits.length === LENGTH) void verify(digits);
  }

  return (
    <motion.div
      key="code"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
      className="flex flex-col justify-between w-full h-full"
    >
      <div className="flex-1 flex lg:justify-center flex-col w-full pt-18">
        <div className="flex flex-col gap-16 items-center">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-3 w-fit text-neutral-600 hover:text-primary-500 transition-colors self-start"
          >
            <ArrowLeft2 size={18} color="#737C8A" variant="Bulk" />
            <span className="text-[1.5rem] leading-8">{t("back")}</span>
          </button>
          <div className="flex flex-col gap-8 items-center text-center">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="font-medium font-primary text-[3.2rem] leading-14 text-black"
            >
              {t("title")}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="text-[1.8rem] leading-10 text-neutral-700"
            >
              {t("description")}{" "}
              <span className="font-semibold text-deep-100">
                {challenge.email}
              </span>
            </motion.p>
          </div>
          <motion.div animate={shake} className="flex gap-4 justify-center">
            {otp.map((digit, index) => (
              <motion.input
                key={index}
                ref={(el) => {
                  refs.current[index] = el;
                }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, scale: digit ? [1, 1.08, 1] : 1 }}
                transition={{ duration: 0.25, delay: 0.2 + index * 0.04 }}
                autoFocus={index === 0}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                aria-label={`${t("digit")} ${index + 1}`}
                maxLength={1}
                value={digit}
                onChange={(e) => change(index, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !otp[index] && index > 0)
                    refs.current[index - 1]?.focus();
                  if (e.key === "Enter") void verify();
                }}
                onPaste={paste}
                className={`w-[5.2rem] h-[5.2rem] text-center text-[2.2rem] font-semibold border-2 rounded-[10px] outline-none focus:border-primary-500 transition-colors duration-200 text-deep-100 bg-neutral-50 ${error ? "border-red-300" : "border-neutral-200"}`}
              />
            ))}
          </motion.div>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="text-red-500 text-[1.3rem] text-center"
            >
              {error}
            </motion.p>
          )}
          <div className="w-full flex flex-col gap-6">
            <ButtonPrimary
              onClick={() => void verify()}
              disabled={isVerifying || otp.join("").length < LENGTH}
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? <LoadingCircleSmall /> : t("submit")}
            </ButtonPrimary>
            <ButtonSecondary
              onClick={resend}
              disabled={isResending || resendIn > 0}
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendIn > 0
                ? t("resend_in", { seconds: resendIn })
                : t("resend")}
            </ButtonSecondary>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
