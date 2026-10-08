/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Organisation } from "@ticketwaze/typescript-config";
import { useRouter } from "@/i18n/navigation";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import {
  AuthHeading,
  AuthItem,
  AuthScreen,
  AuthStatus,
  SigningIn,
  pillActionClass,
} from "@/components/auth/AuthParts";
import OrgBadge from "@/components/auth/OrgBadge";
import successBadge from "@/assets/images/auth/success-badge.png";
import { acceptInvitation, declineInvitation } from "@/lib/invitations";

// Where a signed-in person goes after any sign-in: the dashboard, a pending
// invitation ("Join <organisation>"), the organizer set-up (no organisation
// yet), or a notice that their organisation is suspended.

type View =
  | { kind: "loading" }
  | { kind: "invite"; organisations: Organisation[] }
  | { kind: "suspended"; organisationName?: string; supportUrl?: string }
  | { kind: "accepted" };

export default function OnboardingLogic({
  response,
  next,
}: {
  response: any;
  /** Where the person was headed before signing in (lib/nextPath). */
  next?: string | null;
}) {
  const t = useTranslations("Auth.onboarding");
  const tInvite = useTranslations("Auth.flow.invitation");
  const { data: session, update } = useSession();
  const locale = useLocale();
  const router = useRouter();
  const [view, setView] = useState<View>({ kind: "loading" });
  const [busy, setBusy] = useState<"join" | "decline" | null>(null);

  useEffect(() => {
    async function route() {
      if (
        response.type === "create" ||
        response.type === "user_onboarding_required"
      ) {
        router.replace("/auth/onboarding/organisation");
      } else if (response.type === "suspended") {
        // Every organisation this person belongs to is suspended. They may
        // well have arrived signed in from the attendee app, so they are not
        // signed out — that would end their session everywhere.
        setView({
          kind: "suspended",
          organisationName: response.organisationName,
          supportUrl: response.supportUrl,
        });
      } else if (response.type === "invite") {
        setView({ kind: "invite", organisations: response.organisations });
      } else if (response.user?.organisations?.[0]?.organisationId) {
        try {
          await update({
            activeOrganisation: {
              ...response.user.organisations[0],
              membershipTier: response.membershipTier,
            },
          });
          window.location.href = `${process.env.NEXT_PUBLIC_ORGANISATION_URL}/${locale}${next ?? "/analytics"}`;
        } catch {
          toast.error(t("loadOrganisationError"));
        }
      } else {
        toast.error(t("noOrganisation"));
      }
    }
    route();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function join(organisation: Organisation) {
    if (!session?.user.accessToken) return;
    setBusy("join");
    const joined = await acceptInvitation(
      organisation.organisationId,
      session.user.accessToken,
      locale,
    );
    if (!joined) {
      toast.error(t("joinError"));
      setBusy(null);
      return;
    }
    await update({ activeOrganisation: joined });
    setView({ kind: "accepted" });
    setTimeout(() => {
      window.location.href = `${process.env.NEXT_PUBLIC_ORGANISATION_URL}/${locale}/analytics`;
    }, 1500);
  }

  async function decline(organisation: Organisation) {
    if (!session?.user.accessToken) return;
    setBusy("decline");
    const ok = await declineInvitation(
      organisation.organisationId,
      session.user.accessToken,
      locale,
    );
    if (!ok) {
      toast.error(t("joinError"));
      setBusy(null);
      return;
    }
    // Ask the API again: another invite, the dashboard, or set-up.
    window.location.reload();
  }

  const invite = view.kind === "invite" ? view.organisations[0] : null;

  return (
    <div className="flex flex-col items-center w-full h-full">
      <AnimatePresence mode="wait" initial={false}>
        {view.kind === "loading" && (
          <motion.div
            key="loading"
            exit={{ opacity: 0 }}
            className="w-full h-full flex items-center justify-center"
          >
            <LoadingCircleSmall />
          </motion.div>
        )}

        {invite && (
          <motion.div
            key={`invite-${invite.organisationId}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="w-full h-full"
          >
            <AuthScreen>
              <div className="flex flex-col gap-16 items-center w-full">
                <OrgBadge
                  name={invite.organisationName}
                  imageUrl={invite.profileImageUrl}
                />
                <AuthHeading
                  title={tInvite("title", { name: invite.organisationName })}
                  description={tInvite("description_signed_in")}
                />
                <div className="w-full flex flex-col gap-6">
                  <AuthItem>
                    <ButtonPrimary
                      onClick={() => join(invite)}
                      disabled={busy !== null}
                      className="w-full h-[6rem] active:scale-[0.98]"
                    >
                      {busy === "join" ? (
                        <LoadingCircleSmall />
                      ) : (
                        tInvite("join")
                      )}
                    </ButtonPrimary>
                  </AuthItem>
                  <AuthItem>
                    <button
                      type="button"
                      onClick={() => decline(invite)}
                      disabled={busy !== null}
                      className={`${pillActionClass} h-[6rem] w-full`}
                    >
                      {busy === "decline" ? (
                        <LoadingCircleSmall />
                      ) : (
                        tInvite("decline")
                      )}
                    </button>
                  </AuthItem>
                </div>
              </div>
            </AuthScreen>
          </motion.div>
        )}

        {view.kind === "suspended" && (
          <motion.div
            key="suspended"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full h-full"
          >
            <AuthScreen centered>
              <div className="flex flex-col gap-16 items-center w-full">
                <AuthHeading
                  title={t("suspended.title")}
                  description={t("suspended.description", {
                    name: view.organisationName ?? "",
                  })}
                />
                <div className="w-full flex flex-col gap-6">
                  {view.supportUrl && (
                    <AuthItem>
                      <a
                        href={view.supportUrl}
                        className="w-full h-[6rem] rounded-[10rem] bg-primary-500 text-white text-[1.5rem] font-medium flex items-center justify-center hover:bg-primary-600 transition-colors"
                      >
                        {t("suspended.support")}
                      </a>
                    </AuthItem>
                  )}
                  <AuthItem>
                    <a
                      href={`${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/explore`}
                      className={`${pillActionClass} h-[6rem] w-full`}
                    >
                      {t("suspended.back")}
                    </a>
                  </AuthItem>
                </div>
              </div>
            </AuthScreen>
          </motion.div>
        )}

        {view.kind === "accepted" && (
          <motion.div
            key="accepted"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full h-full"
          >
            <AuthScreen centered>
              <AuthStatus
                image={successBadge}
                title={tInvite("accepted_title")}
                description={tInvite("accepted_description")}
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
