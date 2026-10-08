"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { AnimatePresence, motion } from "motion/react";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PasswordInput } from "@/components/shared/Inputs";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import successBadge from "@/assets/images/auth/success-badge.png";
import mail from "@/assets/icons/mail-big.svg";
import {
  AuthError,
  AuthHeading,
  AuthItem,
  AuthScreen,
  AuthStatus,
  FooterPill,
  FooterPillText,
  SigningIn,
  pillActionClass,
} from "@/components/auth/AuthParts";
import type { InvitationLookup } from "./page";

const slide = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.22, ease: "easeInOut" as const },
};

const INVITATION_ERRORS = [
  "INVITATION_NOT_FOUND",
  "INVITATION_EXPIRED",
  "INVITATION_USED",
  "ADMIN_EXISTS",
] as const;
type InvitationError = (typeof INVITATION_ERRORS)[number];

/**
 * Figma "Admin" → Authentication → Invitation: "Join Ticketwaze" with the
 * invited (masked) address, choose a password, then "Invitation Accepted!"
 * while the session opens. The link proved the inbox, so no code is asked.
 */
export default function JoinPageContent({
  token,
  invitation,
}: {
  token: string;
  invitation: InvitationLookup;
}) {
  const t = useTranslations("Auth.join");
  const tErrors = useTranslations("Auth.errors");
  const locale = useLocale();
  const [view, setView] = useState<"form" | "accepted">("form");
  const [invalid, setInvalid] = useState<string | null>(
    invitation.status === "invalid" ? invitation.code : null,
  );
  const [formError, setFormError] = useState("");

  const Schema = z
    .object({
      password: z
        .string()
        .min(8, t("errors.password"))
        .refine((p) => /[A-Z]/.test(p), t("errors.password"))
        .refine(
          (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
          t("errors.password"),
        )
        .refine((p) => /[0-9]/.test(p), t("errors.password")),
      password_confirmation: z.string(),
    })
    .refine((d) => d.password === d.password_confirmation, {
      message: t("errors.password_match"),
      path: ["password_confirmation"],
    });
  type TSchema = z.infer<typeof Schema>;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TSchema>({ resolver: zodResolver(Schema) });

  async function submit(data: TSchema) {
    setFormError("");
    const result = await signIn("admin-invitation", {
      token,
      password: data.password,
      password_confirmation: data.password_confirmation,
      redirect: false,
    });
    if (result?.error) {
      const code = result.code ?? "";
      if ((INVITATION_ERRORS as readonly string[]).includes(code)) {
        setInvalid(code);
      } else if (code === "INVALID_PASSWORD") {
        setFormError(t("errors.password"));
      } else if (code === "TOO_MANY_ATTEMPTS") {
        setFormError(tErrors("too_many"));
      } else {
        setFormError(tErrors("generic"));
      }
      return;
    }
    setView("accepted");
    // Let "Invitation Accepted!" land before the dashboard loads.
    setTimeout(() => {
      window.location.href = `${process.env.NEXT_PUBLIC_ADMIN_URL}/${locale}/analytics`;
    }, 1600);
  }

  const signInFooter = (
    <FooterPill>
      <FooterPillText>{t("footer.text")}</FooterPillText>
      <Link href="/auth/login" className={pillActionClass}>
        {t("footer.cta")}
      </Link>
    </FooterPill>
  );

  return (
    <div className="flex flex-col items-center w-full h-full">
      <AnimatePresence mode="wait" initial={false}>
        {invalid ? (
          <motion.div key="invalid" {...slide} className="w-full h-full">
            <AuthScreen centered footer={signInFooter}>
              <AuthStatus
                image={mail}
                title={t("invalid_title")}
                description={
                  (INVITATION_ERRORS as readonly string[]).includes(invalid)
                    ? t(`errors.${invalid as InvitationError}`)
                    : t("errors.INVITATION_NOT_FOUND")
                }
              />
            </AuthScreen>
          </motion.div>
        ) : view === "form" && invitation.status === "ok" ? (
          <motion.div key="form" {...slide} className="w-full h-full">
            <AuthScreen footer={signInFooter}>
              <form
                onSubmit={handleSubmit(submit)}
                noValidate
                className="flex flex-col gap-16 items-center w-full"
              >
                <AuthHeading
                  title={t("title")}
                  description={
                    <>
                      {t("hello")}{" "}
                      <span className="font-bold text-deep-100">
                        {invitation.email}
                      </span>
                      {t("description")}
                    </>
                  }
                />
                <div className="w-full flex flex-col gap-6">
                  <AuthItem>
                    <PasswordInput
                      {...register("password")}
                      autoComplete="new-password"
                      validate
                      t={t}
                      error={errors.password?.message}
                    >
                      {t("placeholders.password")}
                    </PasswordInput>
                  </AuthItem>
                  <AuthItem>
                    <PasswordInput
                      {...register("password_confirmation")}
                      autoComplete="new-password"
                      error={errors.password_confirmation?.message}
                    >
                      {t("placeholders.confirm")}
                    </PasswordInput>
                  </AuthItem>
                </div>
                <div className="w-full flex flex-col gap-6 items-center">
                  <AuthError message={formError} />
                  <AuthItem>
                    <ButtonPrimary
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-[6rem] active:scale-[0.98]"
                    >
                      {isSubmitting ? <LoadingCircleSmall /> : t("cta")}
                    </ButtonPrimary>
                  </AuthItem>
                </div>
              </form>
            </AuthScreen>
          </motion.div>
        ) : (
          <motion.div key="accepted" {...slide} className="w-full h-full">
            <AuthScreen centered>
              <AuthStatus
                image={successBadge}
                title={t("accepted.title")}
                description={t("accepted.description")}
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
