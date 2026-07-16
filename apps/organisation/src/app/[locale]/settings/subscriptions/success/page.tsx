"use client";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { TickCircle, CloseCircle, Crown } from "iconsax-reactjs";
import OrganizerLayout from "@/components/Layouts/OrganizerLayout";

type Status = "loading" | "success" | "pending" | "error";

export default function SubscriptionSuccessPage() {
  const t = useTranslations("Settings.subscriptions");
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { data: session } = useSession();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");

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
          setStatus("success");
        } else if (data.status === "pending") {
          setStatus("pending");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    }

    finalize();
  }, [sessionId, session]);

  return (
    <OrganizerLayout title="">
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-10 px-4 text-center">
        {status === "loading" && (
          <>
            <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center">
              <LoadingCircleSmall />
            </div>
            <p className="text-[1.6rem] font-medium text-black">
              {t("payment.finalizing")}
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-24 h-24 rounded-full bg-primary-500/10 flex items-center justify-center">
              <TickCircle size="48" color="#E45B00" variant="Bulk" />
            </div>
            <div className="flex flex-col gap-3">
              <h1 className="text-[2.8rem] font-primary font-medium text-black">
                {t("payment.success_title")}
              </h1>
              <p className="text-[1.5rem] text-neutral-500 max-w-160">
                {t("payment.success_desc")}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <ButtonPrimary
                onClick={() => router.push("/settings/subscriptions")}
                className="gap-3"
              >
                <Crown size="18" color="#fff" variant="Bulk" />
                {t("payment.success_back")}
              </ButtonPrimary>
            </div>
          </>
        )}

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
