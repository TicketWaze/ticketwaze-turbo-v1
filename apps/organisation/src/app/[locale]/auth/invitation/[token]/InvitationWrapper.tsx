"use client";
import { Link } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { AnimatePresence, motion } from "motion/react";
import { PasswordInput } from "@/components/shared/Inputs";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import {
  AuthHeading,
  AuthItem,
  AuthScreen,
  AuthStatus,
  FooterPill,
  FooterPillText,
  SigningIn,
  pillActionClass,
} from "@/components/auth/AuthParts";
import TermsNote from "@/components/auth/TermsNote";
import OrgBadge from "@/components/auth/OrgBadge";
import successBadge from "@/assets/images/auth/success-badge.png";
import { acceptInvitation } from "@/lib/invitations";

// Figma "Organizers + Mobile" → Authentication → Invitation: the link from a
// team invite email. Newcomers choose a password and join in one step; people
// who already have an account sign in (or, if signed in, just join).

interface Invitation {
  organisationId: string;
  organisationName: string;
  profileImageUrl: string | null;
  maskedEmail: string;
  hasAccount: boolean;
}

type View = "loading" | "invalid" | "join" | "accepted";

const slide = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.22, ease: "easeInOut" as const },
};

export default function InvitationWrapper({ token }: { token: string }) {
  const t = useTranslations("Auth.flow.invitation");
  const tPassword = useTranslations("Auth.new_password");
  const tRegister = useTranslations("Auth.register");
  const locale = useLocale();
  const { data: session, status, update } = useSession();
  const [view, setView] = useState<View>("loading");
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [joining, setJoining] = useState(false);
  const [wrongAccount, setWrongAccount] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/invitation/${token}`, {
      headers: { "Accept-Language": locale },
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.status === "success") {
          setInvitation(data.invitation);
          setView("join");
        } else setView("invalid");
      })
      .catch(() => !cancelled && setView("invalid"));
    return () => {
      cancelled = true;
    };
  }, [token, locale]);

  function goToDashboard() {
    setView("accepted");
    setTimeout(() => {
      window.location.href = `${process.env.NEXT_PUBLIC_ORGANISATION_URL}/${locale}/analytics`;
    }, 1500);
  }

  // ── Newcomer: choose a password ────────────────────────────────────────────

  const JoinSchema = z
    .object({
      password: z
        .string()
        .min(8, tPassword("errors.password_length"))
        .refine((p) => /[A-Z]/.test(p))
        .refine((p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p)),
      password_confirmation: z.string(),
    })
    .refine((d) => d.password === d.password_confirmation, {
      message: tPassword("errors.password_match"),
      path: ["password_confirmation"],
    });
  type TJoinSchema = z.infer<typeof JoinSchema>;
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TJoinSchema>({ resolver: zodResolver(JoinSchema) });
  const filled = Boolean(watch("password")) && Boolean(watch("password_confirmation"));

  async function joinWithPassword(data: TJoinSchema) {
    try {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/invitation/${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept-Language": locale,
          },
          body: JSON.stringify(data),
        },
      );
      const response = await request.json();
      if (response.status !== "success") {
        if (response.code === "ACCOUNT_EXISTS") {
          toast.info(t("errors.exists"));
          setInvitation((i) => (i ? { ...i, hasAccount: true } : i));
        } else if (response.code === "INVITE_INVALID") {
          setView("invalid");
        } else toast.error(t("errors.generic"));
        return;
      }
      const result = await signIn("credentials", {
        email: response.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error) {
        // Joined, but no session: signing in by hand lands on the dashboard.
        window.location.href = `/${locale}/auth/login?email=${encodeURIComponent(response.email)}`;
        return;
      }
      // The new account belongs to this organisation only, so the session
      // already chose it.
      goToDashboard();
    } catch {
      toast.error(t("errors.generic"));
    }
  }

  // ── Existing account, signed in: join directly ─────────────────────────────

  async function joinSignedIn() {
    if (!invitation || !session?.user.accessToken) return;
    setJoining(true);
    const organisation = await acceptInvitation(
      invitation.organisationId,
      session.user.accessToken,
      locale,
    );
    if (!organisation) {
      setWrongAccount(true);
      setJoining(false);
      return;
    }
    await update({ activeOrganisation: organisation });
    goToDashboard();
  }

  const footer = (
    <FooterPill>
      <FooterPillText>{tRegister("choice.footer.text")}</FooterPillText>
      <Link href="/auth/login?role=organizer" className={pillActionClass}>
        {tRegister("choice.footer.cta")}
      </Link>
    </FooterPill>
  );

  return (
    <div className="flex flex-col items-center w-full h-full">
      <AnimatePresence mode="wait" initial={false}>
        {view === "loading" && (
          <motion.div
            key="loading"
            exit={{ opacity: 0 }}
            className="w-full h-full flex items-center justify-center"
          >
            <LoadingCircleSmall />
          </motion.div>
        )}

        {view === "invalid" && (
          <motion.div key="invalid" {...slide} className="w-full h-full">
            <AuthScreen centered>
              <AuthHeading
                title={t("invalid_title")}
                description={t("invalid_description")}
              />
              <AuthItem className="mt-16">
                <Link
                  href="/auth/login?role=organizer"
                  className={`${pillActionClass} h-[6rem] w-full`}
                >
                  {tRegister("choice.footer.cta")}
                </Link>
              </AuthItem>
            </AuthScreen>
          </motion.div>
        )}

        {view === "join" && invitation && (
          <motion.div key="join" {...slide} className="w-full h-full">
            <AuthScreen footer={invitation.hasAccount ? undefined : footer}>
              <div className="flex flex-col gap-16 items-center w-full">
                <OrgBadge
                  name={invitation.organisationName}
                  imageUrl={invitation.profileImageUrl}
                />
                <AuthHeading
                  title={t("title", { name: invitation.organisationName })}
                  description={
                    invitation.hasAccount
                      ? t("description_existing", {
                          email: invitation.maskedEmail,
                        })
                      : t("description", { email: invitation.maskedEmail })
                  }
                />

                {!invitation.hasAccount && (
                  <form
                    onSubmit={handleSubmit(joinWithPassword)}
                    noValidate
                    className="w-full flex flex-col gap-16"
                  >
                    <div className="w-full flex flex-col gap-6">
                      <AuthItem>
                        <PasswordInput
                          t={tPassword}
                          validate={true}
                          autoComplete="new-password"
                          {...register("password")}
                        >
                          {t("choose")}
                        </PasswordInput>
                      </AuthItem>
                      <AuthItem>
                        <PasswordInput
                          error={errors.password_confirmation?.message}
                          autoComplete="new-password"
                          {...register("password_confirmation")}
                        >
                          {t("confirm")}
                        </PasswordInput>
                      </AuthItem>
                    </div>
                    <AuthItem>
                      <ButtonPrimary
                        type="submit"
                        disabled={isSubmitting || !filled}
                        className="w-full h-[6rem] active:scale-[0.98]"
                      >
                        {isSubmitting ? <LoadingCircleSmall /> : t("join")}
                      </ButtonPrimary>
                    </AuthItem>
                    <AuthItem>
                      <TermsNote />
                    </AuthItem>
                  </form>
                )}

                {invitation.hasAccount && (
                  <div className="w-full flex flex-col gap-8">
                    {wrongAccount && (
                      <p
                        role="alert"
                        className="text-failure text-[1.4rem] text-center"
                      >
                        {t("wrong_account")}
                      </p>
                    )}
                    <AuthItem>
                      {status === "authenticated" && !wrongAccount ? (
                        <ButtonPrimary
                          onClick={joinSignedIn}
                          disabled={joining}
                          className="w-full h-[6rem] active:scale-[0.98]"
                        >
                          {joining ? <LoadingCircleSmall /> : t("join")}
                        </ButtonPrimary>
                      ) : status === "authenticated" ? (
                        <ButtonPrimary
                          onClick={() =>
                            signOut({
                              callbackUrl: `/${locale}/auth/invitation/${token}`,
                            })
                          }
                          className="w-full h-[6rem] active:scale-[0.98]"
                        >
                          {t("sign_out")}
                        </ButtonPrimary>
                      ) : (
                        <Link
                          href="/auth/login?role=organizer"
                          className="w-full h-[6rem] rounded-[10rem] bg-primary-500 text-white text-[1.5rem] font-medium flex items-center justify-center hover:bg-primary-600 transition-colors"
                        >
                          {t("sign_in")}
                        </Link>
                      )}
                    </AuthItem>
                  </div>
                )}
              </div>
            </AuthScreen>
          </motion.div>
        )}

        {view === "accepted" && (
          <motion.div key="accepted" {...slide} className="w-full h-full">
            <AuthScreen centered>
              <AuthStatus
                image={successBadge}
                title={t("accepted_title")}
                description={t("accepted_description")}
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
