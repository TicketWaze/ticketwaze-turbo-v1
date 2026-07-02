"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PageLoader from "@/components/PageLoader";
import { WithdrawalRequest } from "@ticketwaze/typescript-config";
import PayoutSection from "./PayoutSection";
import type { PayoutsSummary } from "./page";

const formatUsd = (n: number) =>
  (n ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function PayoutsPageContent({
  summary,
  requestOrganisation,
  requestOrganisationTotal,
  historyOrganisation,
  historyOrganisationTotal,
}: {
  summary: PayoutsSummary;
  requestOrganisation: WithdrawalRequest[];
  requestOrganisationTotal: number;
  historyOrganisation: WithdrawalRequest[];
  historyOrganisationTotal: number;
}) {
  const t = useTranslations("Payouts");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  function goTo(path: string) {
    setIsLoading(true);
    router.push(path);
  }

  const cards = [
    {
      label: t("summary.total_paid"),
      value: formatUsd(summary.totalPaidUsd),
      suffix: "USD",
    },
    { label: t("summary.total_paid_count"), value: summary.totalPaidCount },
    {
      label: t("summary.pending_org"),
      value: formatUsd(summary.pendingOrganisationUsd),
      suffix: "USD",
    },
    {
      label: t("summary.pending_org_count"),
      value: summary.pendingOrganisationCount,
    },
    {
      label: t("summary.pending_user"),
      value: formatUsd(summary.pendingUserUsd),
      suffix: "USD",
    },
    { label: t("summary.pending_user_count"), value: summary.pendingUserCount },
  ];

  return (
    <div className="overflow-y-scroll flex flex-col gap-12 pb-8">
      <PageLoader isLoading={isLoading} />
      <h3 className="font-medium font-primary text-[2.6rem] leading-12 text-black">
        {t("title")}
      </h3>

      {/* Summary: 3 USD amounts + 3 counts (3 per row desktop, 2 per row mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-neutral-100 border-neutral-100 border-y">
        {cards.map((card, i) => (
          <div key={i} className="px-4 py-6">
            <span className="block text-[14px] text-neutral-600 leading-8 pb-2">
              {card.label}
            </span>
            <p className="font-medium text-[1.6rem] lg:text-[22px] leading-10 font-primary">
              {card.value}{" "}
              {"suffix" in card && card.suffix && (
                <span className="text-neutral-600 text-[1.4rem]">
                  {card.suffix}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>

      <PayoutSection
        title={t("payout_request.title")}
        scope="requests"
        orgRequests={requestOrganisation}
        orgTotal={requestOrganisationTotal}
        goTo={goTo}
      />

      <PayoutSection
        title={t("payout_history.title")}
        scope="history"
        orgRequests={historyOrganisation}
        orgTotal={historyOrganisationTotal}
        goTo={goTo}
      />
    </div>
  );
}
