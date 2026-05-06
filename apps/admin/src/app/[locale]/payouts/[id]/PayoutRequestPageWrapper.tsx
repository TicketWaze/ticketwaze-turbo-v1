"use client";
import BackButton from "@/components/shared/BackButton";
import { ButtonPrimary, ButtonRed } from "@/components/shared/buttons";
import { MarkFailedDialog, MarkPaidDialog } from "./PayoutActionDialogs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActivityPerformanceList from "./ActivityPerformanceList";
import OrganisationStats from "./OrganisationStats";
import Separator from "@/components/shared/Separator";
import { useLocale, useTranslations } from "next-intl";
import formatDate from "@/lib/FormatDate";
import Image from "next/image";
import {
  MembershipTier,
  OrganisationSubscription,
  WithdrawalRequest,
} from "@ticketwaze/typescript-config";
import VerifiedOrganisationCheckMark from "@/components/VerifiedOrganisationCheckMark";

export default function PayoutRequestPageWrapper({
  request,
  organisationTier,
  organisationActiveSubscription,
}: {
  request: WithdrawalRequest;
  organisationTier: MembershipTier;
  organisationActiveSubscription: OrganisationSubscription | null;
}) {
  const t = useTranslations("Payouts");
  const locale = useLocale();
  return (
    <div className="flex flex-col gap-8 h-full overflow-hidden">
      <BackButton text={t("back")}></BackButton>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="items-center font-primary leading-12 font-medium text-[2.6rem]">
          {request.organisation.organisationName}{" "}
          {request.organisation.isVerified && <VerifiedOrganisationCheckMark />}{" "}
          {""}
          {request.status === "SUCCESSFUL" && (
            <span
              className={
                "py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-[#349C2E]  px-2 rounded-[30px] bg-[#f5f5f5]"
              }
            >
              {t("payout_request.table.request_status.approved")}
            </span>
          )}
          {request.status === "PENDING" && (
            <span
              className={
                "py-[.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-[#EA961C]  px-2 rounded-[30px] bg-[#f5f5f5]"
              }
            >
              {t("payout_request.table.request_status.pending")}
            </span>
          )}
          {request.status === "FAILED" && (
            <span
              className={
                "py-[.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-failure  px-2 rounded-[30px] bg-failure/20"
              }
            >
              {t("payout_request.table.request_status.failed")}
            </span>
          )}
        </h2>
        {request.status !== "FAILED" && (
          <div className="flex gap-4 items-center h-fit">
            <MarkFailedDialog
              withdrawalRequestId={request.withdrawalRequestId}
              trigger={
                <ButtonRed className="py-[7.5px]">{t("cancel")}</ButtonRed>
              }
            />
            <MarkPaidDialog
              withdrawalRequestId={request.withdrawalRequestId}
              trigger={
                <ButtonPrimary className="py-[7.5px]">
                  {t("paid")}
                </ButtonPrimary>
              }
            />
          </div>
        )}
      </div>
      <main className="w-full gap-16 flex flex-col lg:grid lg:grid-cols-[15fr_21fr] lg:min-h-0">
        <div className="flex flex-col gap-8 overflow-y-auto min-h-0 max-h-[calc(100vh-200px)]">
          <div className="w-fit max-h-[29.8rem] overflow-hidden rounded-[10px] shrink-0">
            {request.organisation.profileImageUrl ? (
              <Image
                src={request.organisation.profileImageUrl}
                width={400}
                height={298}
                alt="img"
                className="w-full"
              />
            ) : (
              <div className="h-60 w-full flex items-center justify-center bg-black text-white text-9xl font-primary">
                {request.organisation.organisationName
                  .slice()[0]
                  ?.toUpperCase()}
              </div>
            )}
          </div>
          <Separator />
          <div className="flex flex-col gap-6">
            <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
              {t("request_details.title")}
            </span>
            <div className="flex flex-col gap-5">
              {(
                [
                  [
                    t("payout_request.table.withdrawal_id"),
                    request.withdrawalRequestId,
                  ],
                  [t("request_details.account_type"), request.accountType],
                  [t("request_details.bank_name"), request.bankName],
                  [t("request_details.account_name"), request.accountName],
                  [t("request_details.account"), request.accountNumber],
                  [t("request_details.currency"), request.currency],
                  [
                    t("request_details.amount"),
                    <span key="amt">
                      <span className="font-medium">
                        {request.currency === "USD"
                          ? request.usdAmount.toLocaleString()
                          : request.amount.toLocaleString()}
                      </span>{" "}
                      <span className="text-neutral-500 text-[1.3rem]">
                        {request.currency}
                      </span>
                    </span>,
                  ],
                  request.currency !== "USD" && [
                    t("request_details.usd_amount"),
                    <span key="usd">
                      <span className="font-medium">
                        {request.usdAmount.toLocaleString()}
                      </span>{" "}
                      <span className="text-neutral-500 text-[1.3rem]">
                        USD
                      </span>
                    </span>,
                  ],
                  [
                    t("request_details.request_status"),
                    request.status === "SUCCESSFUL" ? (
                      <span
                        key="s"
                        className="text-[1.1rem] font-bold uppercase leading-6 text-[#349C2E] bg-[#f5f5f5] px-2 py-[0.3rem] rounded-[30px]"
                      >
                        {t("payout_request.table.request_status.approved")}
                      </span>
                    ) : request.status === "PENDING" ? (
                      <span
                        key="p"
                        className="text-[1.1rem] font-bold uppercase leading-6 text-[#EA961C] bg-[#f5f5f5] px-2 py-[0.3rem] rounded-[30px]"
                      >
                        {t("payout_request.table.request_status.pending")}
                      </span>
                    ) : (
                      <span
                        key="f"
                        className="text-[1.1rem] font-bold uppercase leading-6 text-failure bg-[#FCE5EA] px-2 py-[0.3rem] rounded-[30px]"
                      >
                        {t("payout_request.table.request_status.failed")}
                      </span>
                    ),
                  ],
                  [
                    t("request_details.request_date"),
                    formatDate(request.createdAt, locale, "UTC"),
                  ],
                  [
                    t("request_details.processed_date"),
                    formatDate(request.updatedAt, locale, "UTC"),
                  ],
                ] as ([string, React.ReactNode] | false)[]
              )
                .filter((item): item is [string, React.ReactNode] =>
                  Boolean(item),
                )
                .map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="flex flex-col gap-[0.4rem]"
                  >
                    <span className="text-[1.1rem] leading-6 text-neutral-500 uppercase font-medium tracking-wide">
                      {label}
                    </span>
                    <span className="text-[1.5rem] leading-8 text-neutral-900 wrap-break-word">
                      {value ?? <span className="text-neutral-400">—</span>}
                    </span>
                  </div>
                ))}
            </div>
            <div></div>
          </div>
        </div>

        <div className="min-h-[75vh]">
          <Tabs defaultValue="performance" className="w-full h-full">
            <TabsList className={"w-full lg:w-fit mx-auto lg:mx-0 mb-8"}>
              <TabsTrigger value="performance">
                {t("activity.title")}
              </TabsTrigger>
              <TabsTrigger value="stats">{t("stats.title")}</TabsTrigger>
            </TabsList>
            <TabsContent value="performance">
              <ActivityPerformanceList events={request.organisation.events} />
            </TabsContent>
            <TabsContent
              value="stats"
              className="overflow-y-auto max-h-[calc(100vh-260px)]"
            >
              <OrganisationStats
                organisation={request.organisation}
                membershipTier={organisationTier}
                subscription={organisationActiveSubscription}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
