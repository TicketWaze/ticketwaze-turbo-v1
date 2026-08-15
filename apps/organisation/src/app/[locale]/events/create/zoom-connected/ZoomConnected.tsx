"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { InfoCircle } from "iconsax-reactjs";
import PageLoader from "@/components/PageLoader";
import { LinkPrimary } from "@/components/shared/Links";
import { hasRedeemed, markRedeemed } from "@/lib/oauthRedeemGuard";

type Outcome =
  | { kind: "working" }
  | { kind: "unlicensed" }
  | { kind: "failed"; message: string };

/**
 * Finishes the Zoom OAuth exchange and sends the organiser back into the flow.
 *
 * The exchange happens here rather than server-side because the API's callback
 * route sits behind auth: the organiser's access token is what proves the code
 * may be redeemed against this organisation at all.
 */
export default function ZoomConnected({
  code,
  state,
  error,
}: {
  code: string | undefined;
  state: string | undefined;
  error: string | undefined;
}) {
  const t = useTranslations("Events.create_event.list.online.zoom");
  const router = useRouter();
  const { data: session, status } = useSession();
  const [outcome, setOutcome] = useState<Outcome>({ kind: "working" });
  /**
   * An authorisation code can be redeemed exactly once. React runs effects
   * twice in development, and a second redemption fails — so the guard is what
   * stops a successful connection reporting itself as broken.
   */
  const redeemed = useRef(false);

  /**
   * Zoom came back without a code, or said no outright. Derived during render
   * rather than set from the effect: there is nothing to redeem, so there is
   * nothing to wait for, and the answer is already known from the URL.
   */
  const cameBackEmpty = Boolean(error) || !code || !state;

  /**
   * Where this connection was started from, packed into `state` by the API
   * because it is the only field Zoom echoes back and the redirect URI is one
   * fixed URL shared by both entry points.
   */
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
          `${process.env.NEXT_PUBLIC_API_URL}/events/zoom/callback`,
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
          setOutcome({
            kind: "failed",
            message: response.message ?? t("connectFailed"),
          });
          return;
        }

        /**
         * Connected, but on a free plan. Reported rather than refused: the
         * connection itself is fine and worth keeping, and the organiser may
         * be about to upgrade. The refusal belongs at event creation, where
         * real tickets are at stake.
         */
        if (!response.zoom?.isLicensed) {
          setOutcome({ kind: "unlicensed" });
          return;
        }

        /**
         * Back where they started. An organiser who connected from settings
         * was not creating anything, so dropping them into the category list
         * would start a task they never asked for.
         */
        router.replace(
          origin === "settings"
            ? "/settings/integrations?connected=zoom"
            : "/events/create/meet/categories?provider=zoom",
        );
      } catch {
        setOutcome({ kind: "failed", message: t("connectFailed") });
      }
    })();
  }, [code, state, cameBackEmpty, origin, status, session, router, t]);

  if (!cameBackEmpty && outcome.kind === "working") {
    return <PageLoader isLoading={true} />;
  }

  const message =
    outcome.kind === "unlicensed"
      ? t("paidPlanBody")
      : outcome.kind === "failed"
        ? outcome.message
        : t("connectFailed");

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
          {message}
        </p>
        {/* Back to wherever this started, not always to the create flow. */}
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
