"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { InfoCircle } from "iconsax-reactjs";
import PageLoader from "@/components/PageLoader";
import { LinkPrimary } from "@/components/shared/Links";
import { hasRedeemed, markRedeemed } from "@/lib/oauthRedeemGuard";

/**
 * Finishes the Google OAuth exchange and sends the organiser back into the flow.
 *
 * The exchange happens here rather than at event-creation time, which is what
 * the old flow did — it carried the `code` through three screens of a form and
 * redeemed it on submit. Authorisation codes expire in minutes, so an organiser
 * who filled the form slowly lost the connection to "invalid or expired". The
 * connection is now established the moment they return, and creating an event
 * just uses the stored refresh token.
 */
export default function GoogleConnected({
  code,
  state,
  error,
}: {
  code: string | undefined;
  state: string | undefined;
  error: string | undefined;
}) {
  const t = useTranslations("Events.create_event.list.online.googleMeet");
  const router = useRouter();
  const { data: session, status } = useSession();
  const [failure, setFailure] = useState<string | null>(null);
  /**
   * An authorisation code can be redeemed exactly once. React runs effects
   * twice in development, and a second redemption fails — so the guard is what
   * stops a successful connection reporting itself as broken.
   */
  const redeemed = useRef(false);

  // Derived during render rather than set from the effect: there is nothing to
  // redeem, so the answer is already known from the URL.
  const cameBackEmpty = Boolean(error) || !code || !state;

  const origin = state?.split(".")[2] === "settings" ? "settings" : "create";

  useEffect(() => {
    if (cameBackEmpty) return;
    if (status === "loading") return;
    if (redeemed.current || hasRedeemed(code)) return;
    redeemed.current = true;
    // Persisted, not just held in a ref: a Fast Refresh remount would reset
    // the ref and redeem the code a second time, turning a connection that
    // already succeeded into "the provider refused the connection".
    markRedeemed(code);

    (async () => {
      try {
        const request = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/events/google/callback`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.user.accessToken}`,
            },
            body: JSON.stringify({ code, state }),
          },
        );
        const response = await request.json();

        if (response.status !== "success") {
          setFailure(response.message ?? t("connectFailed"));
          return;
        }

        router.replace(
          origin === "settings"
            ? "/settings/integrations?connected=google"
            : "/events/create/meet/categories?provider=google_meet",
        );
      } catch {
        setFailure(t("connectFailed"));
      }
    })();
  }, [code, state, cameBackEmpty, origin, status, session, router, t]);

  if (!cameBackEmpty && !failure) {
    return <PageLoader isLoading={true} />;
  }

  return (
    <div
      className={
        "h-full w-full justify-center mx-auto flex flex-col items-center gap-12"
      }
    >
      <div
        className={
          "w-[120px] h-[120px] rounded-full flex items-center justify-center bg-neutral-100"
        }
      >
        <div
          className={
            "w-[90px] h-[90px] rounded-full flex items-center justify-center bg-neutral-200"
          }
        >
          <InfoCircle size="50" color="#0d0d0d" variant="Bulk" />
        </div>
      </div>
      <div className={"flex flex-col gap-12 items-center text-center"}>
        <p
          className={
            "text-[1.8rem] leading-[25px] text-neutral-600 max-w-[330px] lg:max-w-[422px]"
          }
        >
          {failure ?? t("connectFailed")}
        </p>
        <LinkPrimary
          href={
            origin === "settings"
              ? "/settings/integrations"
              : "/events/create/meet"
          }
        >
          {t("back")}
        </LinkPrimary>
      </div>
    </div>
  );
}
