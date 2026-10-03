"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { CloseCircle } from "iconsax-reactjs";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import OtpCodeInput, { emptyOtp } from "@/components/auth/OtpCodeInput";
import { AuthError } from "@/components/auth/AuthParts";
import { Row, Section, Toggle } from "@/components/settings/SettingRows";

type Pending = {
  challengeId: string;
  email: string;
  turningOn: boolean;
};

/**
 * Figma "Security · 2FA". Flipping the toggle emails a code; the change only
 * lands once that code is entered here, which also proves the inbox works
 * before sign-in starts depending on it.
 */
export default function TwoFactorSection({
  initialEnabled,
  hasPassword,
  index,
}: {
  initialEnabled: boolean;
  hasPassword: boolean;
  index: number;
}) {
  const t = useTranslations("Settings.security");
  const locale = useLocale();
  const { data: session } = useSession();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, setPending] = useState<Pending | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [otp, setOtp] = useState(emptyOtp);
  const [error, setError] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  async function call(path: string, body: unknown) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
        "Accept-Language": locale,
      },
      body: JSON.stringify(body),
    });
    return (await response.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
  }

  function message(code: unknown, attemptsLeft?: unknown) {
    if (code === "INVALID_CODE")
      return typeof attemptsLeft === "number" && attemptsLeft > 0
        ? t("errors.invalidLeft", { count: attemptsLeft })
        : t("errors.invalid");
    if (code === "CODE_EXPIRED") return t("errors.expired");
    if (code === "TOO_MANY_ATTEMPTS") return t("errors.tooMany");
    if (code === "CHALLENGE_NOT_FOUND") return t("errors.restart");
    return t("errors.generic");
  }

  async function request() {
    if (!hasPassword || isRequesting) return;
    setIsRequesting(true);
    const turningOn = !enabled;
    const data = await call("/users/me/mfa", { enabled: turningOn });
    setIsRequesting(false);
    if (data?.status === "mfa_required") {
      setOtp(emptyOtp());
      setError("");
      setResendIn(Number(data.resendAfterSeconds ?? 60));
      setPending({
        challengeId: String(data.challengeId),
        email: String(data.email ?? ""),
        turningOn,
      });
    } else if (data?.status === "success") {
      setEnabled(Boolean(data.mfaEnabled));
    } else {
      toast.error(String(data?.message ?? t("errors.generic")));
    }
  }

  async function confirm(entered?: string | React.SyntheticEvent) {
    // OtpCodeInput passes the code it just completed; the Verify button
    // passes its click event, so fall back to state then.
    const code =
      typeof entered === "string" ? entered : otp.join("");
    if (!pending || code.length < 6 || isConfirming) return;
    setIsConfirming(true);
    const data = await call("/users/me/mfa/confirm", {
      challengeId: pending.challengeId,
      code,
    });
    setIsConfirming(false);
    if (data?.status === "success") {
      const now = Boolean(data.mfaEnabled);
      setEnabled(now);
      setPending(null);
      toast.success(now ? t("on") : t("off"));
    } else {
      setOtp(emptyOtp());
      setError(message(data?.code, data?.attemptsLeft));
    }
  }

  async function resend() {
    if (!pending || resendIn > 0) return;
    const data = await call("/users/me/mfa/resend", {
      challengeId: pending.challengeId,
    });
    if (data?.status === "mfa_required") {
      toast.success(t("resent"));
      setOtp(emptyOtp());
      setError("");
      setResendIn(Number(data.resendAfterSeconds ?? 60));
    } else if (data?.code === "RESEND_TOO_SOON") {
      setResendIn(Number(data.retryAfterSeconds ?? 60));
    } else {
      setError(message(data?.code));
    }
  }

  return (
    <Section title={t("title")} index={index}>
      <Row role="switch" ariaChecked={enabled} onClick={request}>
        <span className="flex flex-col gap-1">
          <span className="text-[1.6rem] text-deep-100">{t("label")}</span>
          <span className="text-[1.3rem] leading-[1.8rem] text-neutral-600 max-w-[28rem] lg:max-w-152">
            {hasPassword ? t("description") : t("noPassword")}
          </span>
        </span>
        {isRequesting ? (
          <LoadingCircleSmall />
        ) : (
          <span className={hasPassword ? "" : "opacity-40"}>
            <Toggle on={enabled} />
          </span>
        )}
      </Row>

      <Dialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open && !isConfirming) setPending(null);
        }}
      >
        <DialogContent showCloseButton={false} className="gap-0">
          <div className="flex items-center justify-between gap-4 pb-6 border-b border-neutral-100">
            <DialogTitle className="font-primary font-medium text-[2.2rem] leading-10 text-black">
              {pending?.turningOn ? t("turnOnTitle") : t("turnOffTitle")}
            </DialogTitle>
            <DialogClose
              aria-label={t("cancel")}
              className="cursor-pointer active:scale-90 transition-transform"
            >
              <CloseCircle size={28} color="#737C8A" variant="Bulk" />
            </DialogClose>
          </div>
          <DialogDescription className="pt-6 pb-8 text-[1.5rem] leading-9 text-neutral-600 text-center">
            {t("sent", { email: pending?.email ?? "" })}
          </DialogDescription>
          <div className="flex flex-col gap-6 items-center">
            <OtpCodeInput
              value={otp}
              onChange={(next) => {
                setOtp(next);
                setError("");
              }}
              onSubmit={confirm}
              error={error}
            />
            <AuthError message={error} />
            <ButtonPrimary
              onClick={confirm}
              disabled={isConfirming || otp.join("").length < 6}
              className="w-full"
            >
              {isConfirming ? <LoadingCircleSmall /> : t("confirm")}
            </ButtonPrimary>
            <button
              type="button"
              onClick={resend}
              disabled={resendIn > 0}
              className="text-[1.5rem] leading-8 text-primary-500 hover:underline disabled:text-neutral-500 disabled:no-underline cursor-pointer disabled:cursor-default"
            >
              {resendIn > 0
                ? t("resendIn", { seconds: resendIn })
                : t("resend")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </Section>
  );
}
