"use client";
import AdminLayout from "@/components/Layouts/AdminLayout";
import BackButton from "@/components/shared/BackButton";
import { SuspendDialog } from "./SuspendDialog";
import { ReactivateDialog } from "./ReactivateDialog";
import { VerifyDialog } from "./VerifyDialog";
import { GrantSubscriptionDialog } from "./GrantSubscriptionDialog";
import Separator from "@/components/shared/Separator";
import Image from "next/image";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTranslations, useLocale } from "next-intl";
import { Input, TextArea } from "@/components/shared/Inputs";
import formatDate from "@/lib/FormatDate";
import ActivitySummary from "./ActivitySummary";
import { AdminOrganisation } from "@ticketwaze/typescript-config";
import VerifiedOrganisationCheckMark from "@/components/VerifiedOrganisationCheckMark";

export default function UserPageContent({
  organisation,
  totalRevenue,
  totalTicketsSold,
}: {
  organisation: AdminOrganisation | null;
  totalRevenue: number;
  totalTicketsSold: number;
}) {
  const t = useTranslations("Organisations.profile");
  const locale = useLocale();

  const sub = organisation?.subscription ?? null;
  const subActive =
    !!sub &&
    sub.status === "ACTIVE" &&
    new Date(sub.endsAt as unknown as string).getTime() > Date.now();

  if (!organisation) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-[1.6rem] text-neutral-600">
            Organisation not found.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8 lg:h-full lg:overflow-hidden">
        <BackButton text={t("back")} />
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
          <h2 className="inline-flex items-center gap-2 font-primary leading-12 font-medium text-[2.6rem]">
            {organisation.organisationName}
            {organisation.isVerified && <VerifiedOrganisationCheckMark />}
          </h2>
          <div className="hidden lg:flex gap-4 items-center h-fit">
            <GrantSubscriptionDialog
              organisationId={organisation.organisationId}
            />
            <VerifyDialog
              organisationId={organisation.organisationId}
              isVerified={organisation.isVerified}
            />
            {organisation.isSuspended ? (
              <ReactivateDialog organisationId={organisation.organisationId} />
            ) : (
              <SuspendDialog organisationId={organisation.organisationId} />
            )}
          </div>
        </div>

        <main className="w-full grid grid-cols-1 lg:grid-cols-[15fr_21fr] lg:grid-rows-1 gap-8 lg:gap-16 lg:flex-1 lg:min-h-0">
          <div className="w-full flex flex-col gap-8 lg:overflow-y-auto lg:min-h-0">
            <form className="flex flex-col gap-12 w-full pb-4 overflow-x-hidden">
              <div className="flex flex-col gap-6">
                <div className="w-full bg-primary-500 p-6 rounded-[20px] flex gap-10 items-center">
                  <div className="w-40 h-40 rounded-[25px] bg-neutral-300 overflow-hidden shrink-0">
                    {organisation.profileImageUrl && (
                      <Image
                        src={organisation.profileImageUrl}
                        alt={organisation.organisationName}
                        className="w-full h-full object-cover"
                        width={100}
                        height={100}
                      />
                    )}
                  </div>
                  <span className="text-[2.2rem] text-white font-medium leading-10 capitalize">
                    {organisation.organisationName}
                  </span>
                </div>

                <h3 className="text-deep-100 font-primary font-medium text-[1.8rem] leading-10">
                  {t("profile")}
                </h3>

                <div className="flex gap-6">
                  <Select
                    defaultValue={organisation.state ?? "unknown"}
                    disabled
                  >
                    <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] p-8 border-none w-full text-[1.4rem] text-neutral-700 leading-8">
                      <SelectValue placeholder={organisation.state ?? "—"} />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-100 text-[1.4rem]">
                      <SelectGroup>
                        <SelectItem
                          className="text-[1.4rem] text-deep-100"
                          value={organisation.state ?? "unknown"}
                        >
                          {organisation.state ?? "—"}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Select
                    defaultValue={organisation.city ?? "unknown"}
                    disabled
                  >
                    <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] p-8 border-none w-full text-[1.4rem] text-neutral-700 leading-8">
                      <SelectValue placeholder={organisation.city ?? "—"} />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-100 text-[1.4rem]">
                      <SelectGroup>
                        <SelectItem
                          className="text-[1.4rem] text-deep-100"
                          value={organisation.city ?? "unknown"}
                        >
                          {organisation.city ?? "—"}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <TextArea
                  className="w-full h-60"
                  disabled
                  readOnly
                  value={organisation.organisationDescription}
                >
                  {" "}
                </TextArea>

                <Input type="email" disabled readOnly>
                  {organisation.organisationEmail}
                </Input>

                <Input type="tel" disabled readOnly>
                  {organisation.organisationPhoneNumber}
                </Input>

                {organisation.organisationWebsite && (
                  <Input type="url" disabled readOnly>
                    {organisation.organisationWebsite}
                  </Input>
                )}
              </div>
            </form>

            {/* Subscription */}
            <div className="flex flex-col gap-6 w-full pb-4">
              <h3 className="text-deep-100 font-primary font-medium text-[1.8rem] leading-10">
                {t("subscription.title")}
              </h3>
              <div className="flex flex-col gap-6 border border-neutral-100 rounded-[20px] p-6">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[1.6rem] text-neutral-600 leading-8">
                    {t("subscription.plan")}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-[1.6rem] font-medium text-deep-100 capitalize leading-8">
                      {subActive ? sub!.membershipTier : t("subscription.free")}
                    </span>
                    {subActive &&
                      (sub!.paymentMethod === "complimentary" ? (
                        <span className="text-[1.1rem] font-bold uppercase leading-6 text-primary-500 bg-primary-50 px-2 py-[0.3rem] rounded-[30px]">
                          {t("subscription.complimentary")}
                        </span>
                      ) : sub!.isTrial ? (
                        <span className="text-[1.1rem] font-bold uppercase leading-6 text-[#EA961C] bg-[#FEF3E2] px-2 py-[0.3rem] rounded-[30px]">
                          {t("subscription.trial")}
                        </span>
                      ) : (
                        <span className="text-[1.1rem] font-bold uppercase leading-6 text-emerald-600 bg-emerald-50 px-2 py-[0.3rem] rounded-[30px]">
                          {t("subscription.active")}
                        </span>
                      ))}
                  </span>
                </div>

                {subActive ? (
                  <>
                    {!sub!.isTrial && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[1.6rem] text-neutral-600 leading-8">
                          {t("subscription.billing")}
                        </span>
                        <span className="text-[1.6rem] text-deep-100 leading-8">
                          {t(`subscription.${sub!.billingCycle}`)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[1.6rem] text-neutral-600 leading-8">
                        {t("subscription.started")}
                      </span>
                      <span className="text-[1.6rem] text-deep-100 leading-8">
                        {formatDate(
                          sub!.createdAt as unknown as string,
                          locale,
                          "local",
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[1.6rem] text-neutral-600 leading-8">
                        {t("subscription.expires")}
                      </span>
                      <span className="text-[1.6rem] text-deep-100 leading-8">
                        {formatDate(
                          sub!.endsAt as unknown as string,
                          locale,
                          "local",
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[1.6rem] text-neutral-600 leading-8">
                        {t("subscription.method")}
                      </span>
                      <span className="text-[1.6rem] text-deep-100 leading-8 capitalize">
                        {sub!.paymentMethod}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-[1.4rem] text-neutral-500 leading-7">
                    {t("subscription.none")}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="min-h-[75vh] lg:min-h-0">
            <Tabs defaultValue="summary" className="w-full h-full">
              <TabsList className="w-full lg:w-fit mx-auto lg:mx-0 mb-8">
                <TabsTrigger value="summary">{t("summary.title")}</TabsTrigger>
                <TabsTrigger value="finance">{t("finance.title")}</TabsTrigger>
              </TabsList>
              <ActivitySummary
                events={organisation.events ?? []}
                createdAt={organisation.createdAt}
              />
              <Finance
                totalTicketsSold={totalTicketsSold}
                totalRevenue={totalRevenue}
                availableBalance={organisation.availableBalance}
                pendingBalance={organisation.pendingBalance}
                currency={organisation.currency}
              />
            </Tabs>
          </div>
        </main>

        <div className="lg:hidden flex flex-col gap-4 pb-6">
          <GrantSubscriptionDialog
            organisationId={organisation.organisationId}
          />
          <VerifyDialog
            organisationId={organisation.organisationId}
            isVerified={organisation.isVerified}
          />
          {organisation.isSuspended ? (
            <ReactivateDialog organisationId={organisation.organisationId} />
          ) : (
            <SuspendDialog organisationId={organisation.organisationId} />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function Finance({
  totalTicketsSold,
  totalRevenue,
  availableBalance,
  pendingBalance,
  currency,
}: {
  totalTicketsSold: number;
  totalRevenue: number;
  availableBalance: number;
  pendingBalance: number;
  currency: string;
}) {
  const t = useTranslations("Organisations.profile");
  return (
    <TabsContent value="finance">
      <ul className="flex flex-col pt-4 gap-8 overflow-y-scroll">
        <li className="flex justify-between">
          <span className="text-[1.6rem] text-neutral-600 leading-[22.5px]">
            {t("finance.total_ticket_sold")}
          </span>
          <span className="text-[1.6rem] text-deep-100 font-medium leading-8">
            {totalTicketsSold.toLocaleString()}
          </span>
        </li>

        <li className="flex justify-between">
          <span className="text-[1.6rem] text-neutral-600 leading-[22.5px]">
            {t("finance.total_revenue")}
          </span>
          <span className="text-[1.6rem] text-deep-100 font-medium leading-8">
            {totalRevenue.toLocaleString()} {currency}
          </span>
        </li>

        <Separator />

        <li className="flex justify-between">
          <span className="text-[1.6rem] text-neutral-600 leading-[22.5px]">
            {t("finance.pending_balance")}
          </span>
          <span className="text-[1.6rem] text-deep-100 font-medium leading-8">
            {pendingBalance.toLocaleString()} {currency}
          </span>
        </li>

        <li className="flex justify-between">
          <span className="text-[1.6rem] text-neutral-600 leading-[22.5px]">
            {t("finance.balance")}
          </span>
          <span className="text-[1.6rem] text-deep-100 font-medium leading-8">
            {availableBalance.toLocaleString()} {currency}
          </span>
        </li>
      </ul>
    </TabsContent>
  );
}
