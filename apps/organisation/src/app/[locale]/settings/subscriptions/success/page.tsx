"use client";
import { ButtonPrimary } from "@/components/shared/buttons";
import BrandedLoader from "@/components/shared/BrandedLoader";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CloseCircle, Crown } from "iconsax-reactjs";
import OrganizerLayout from "@/components/Layouts/OrganizerLayout";

type Status = "loading" | "success" | "pending" | "error";

export default function SubscriptionSuccessPage() {
  const t = useTranslations("Settings.subscriptions");
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const provider = searchParams.get("provider");
  const payment = searchParams.get("payment");
  const { data: session } = useSession();
  const router = useRouter();
  const [stripeStatus, setStripeStatus] = useState<Status>("loading");

  // The mobile wallets settle server-side before redirecting here, so the
  // outcome is already in the URL — there is no checkout session left to
  // finalise. NatCash can also come back undecided: it reports '-3' while it
  // makes up its mind, which leaves the payment PENDING rather than failed, so
  // that must not be shown as an error.
  const isWallet = provider === "moncash" || provider === "natcash";
  const status: Status = isWallet
    ? payment === "success"
      ? "success"
      : payment === "pending"
        ? "pending"
        : "error"
    : stripeStatus;

  useEffect(() => {
    if (!sessionId || !session) return;

    async function finalize() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/memberships/checkout/${sessionId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.user.accessToken ?? ""}`,
              origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
            },
          },
        );
        const data = await res.json();
        if (data.status === "success" || data.status === "duplicate") {
          setStripeStatus("success");
        } else if (data.status === "pending") {
          setStripeStatus("pending");
        } else {
          setStripeStatus("error");
        }
      } catch {
        setStripeStatus("error");
      }
    }

    finalize();
  }, [sessionId, session]);

  // This page has nothing to say once the plan is active — send them straight to
  // their subscriptions instead of parking them behind a confirmation button.
  // refresh() is what makes the page show the new plan rather than the cached
  // pre-purchase render.
  useEffect(() => {
    if (status !== "success") return;
    router.replace("/settings/subscriptions");
    router.refresh();
  }, [status, router]);

  return (
    <OrganizerLayout title="">
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-10 px-4 text-center">
        {/* The redirect above fires the moment we succeed, so the loader also
            covers the hand-off — no success screen ever flashes. */}
        {(status === "loading" || status === "success") && <BrandedLoader />}

        {status === "pending" && (
          <>
            <div className="w-24 h-24 rounded-full bg-neutral-100 flex items-center justify-center">
              <Crown size="48" color="#737c8a" variant="Bulk" />
            </div>
            <div className="flex flex-col gap-3">
              <h1 className="text-[2.8rem] font-primary font-medium text-black">
                {t("payment.pending_title")}
              </h1>
              <p className="text-[1.5rem] text-neutral-500 max-w-160">
                {t("payment.pending_desc")}
              </p>
            </div>
            <ButtonPrimary
              onClick={() => router.push("/settings/subscriptions")}
              className="gap-3"
            >
              {t("payment.success_back")}
            </ButtonPrimary>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center">
              <CloseCircle size="48" color="#E53935" variant="Bulk" />
            </div>
            <div className="flex flex-col gap-3">
              <h1 className="text-[2.8rem] font-primary font-medium text-black">
                {t("payment.error_title")}
              </h1>
              <p className="text-[1.5rem] text-neutral-500 max-w-160">
                {t("payment.error_desc")}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <ButtonPrimary
                onClick={() => router.push("/settings/subscriptions/upgrade")}
                className="gap-3"
              >
                {t("payment.error_retry")}
              </ButtonPrimary>
            </div>
          </>
        )}
      </div>
    </OrganizerLayout>
  );
}
