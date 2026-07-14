"use client";
import { formatMoney } from "@ticketwaze/currency";
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import { OrganisationSubscription } from "@ticketwaze/typescript-config";
import { useLocale, useTranslations } from "next-intl";
import { ButtonAccent } from "@/components/shared/buttons";

function formatDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function Separator() {
  return <div className="w-full h-px bg-neutral-100 my-6" />;
}

export default function SubscriptionDetailDrawerContent({
  sub,
}: {
  sub: OrganisationSubscription;
}) {
  const t = useTranslations("Settings.subscriptions");
  const locale = useLocale();

  const startDate = new Date(sub.createdAt as unknown as string);
  const endDate = new Date(sub.endsAt as unknown as string);

  const billingCycleLabel =
    sub.billingCycle === "yearly" ? t("drawer.yearly") : t("drawer.monthly");

  const paymentMethodLabel =
    sub.paymentMethod === "stripe"
      ? t("drawer.stripe")
      : sub.paymentMethod === "moncash"
        ? t("drawer.moncash")
        : sub.paymentMethod;

  const statusColors: Record<string, string> = {
    ACTIVE: "text-[#349C2E]",
    CANCELED: "text-failure",
    EXPIRED: "text-neutral-500",
  };

  return (
    <DrawerContent className={"my-6 p-12 rounded-[30px] w-full"}>
      <div className={"w-full flex flex-col items-center overflow-y-scroll"}>
        <DrawerTitle className={"pb-16"}>
          <span
            className={
              "font-primary font-medium text-center text-[2.6rem] leading-12 text-black capitalize"
            }
          >
            {sub.membershipTier} {t("plan_label")}
          </span>
        </DrawerTitle>

        <DrawerDescription asChild className="w-full">
          <div>
            {/* Plan info */}
            <div className={"w-full flex flex-col gap-8"}>
              <p className={"flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"}>
                {t("drawer.plan")}
                <span className={"text-deep-100 font-medium leading-8 capitalize"}>
                  {sub.subscriptionName || sub.membershipTier}
                </span>
              </p>
              <p className={"flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"}>
                {t("drawer.billing_cycle")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {billingCycleLabel}
                </span>
              </p>
              <p className={"flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"}>
                {t("drawer.payment_method")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {paymentMethodLabel}
                </span>
              </p>
            </div>

            <Separator />

            {/* Financials */}
            <div className={"w-full flex flex-col gap-8"}>
              <p className={"flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"}>
                {t("drawer.amount_usd")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {formatMoney(sub.usdAmountPaid, "USD")}
                </span>
              </p>
              <p className={"flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"}>
                {t("table.status")}
                <span
                  className={`py-[.3rem] text-[1.1rem] font-bold leading-6 uppercase px-2 rounded-[30px] bg-[#f5f5f5] ${statusColors[sub.status] ?? "text-neutral-500"}`}
                >
                  {sub.status}
                </span>
              </p>
            </div>

            <Separator />

            {/* Dates */}
            <div className={"w-full flex flex-col gap-8"}>
              <p className={"flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"}>
                {t("drawer.start_date")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {formatDate(startDate, locale)}
                </span>
              </p>
              <p className={"flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"}>
                {t("drawer.end_date")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {formatDate(endDate, locale)}
                </span>
              </p>
              {sub.isTrial && sub.trialEndsAt && (
                <p className={"flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"}>
                  {t("trial_badge")}
                  <span className={"text-primary-500 font-medium leading-8"}>
                    {formatDate(new Date(sub.trialEndsAt as unknown as string), locale)}
                  </span>
                </p>
              )}
            </div>

            <Separator />

            {/* IDs */}
            <div className={"w-full flex flex-col gap-8"}>
              <p className={"flex justify-between items-start text-[1.4rem] leading-8 text-neutral-600"}>
                {t("drawer.subscription_id")}
                <span className={"text-primary-500 font-bold truncate leading-8 max-w-[20rem] text-right font-mono text-[1.2rem]"}>
                  {sub.organisationSubscriptionId}
                </span>
              </p>
              {sub.stripeSubscriptionId && (
                <p className={"flex justify-between items-start text-[1.4rem] leading-8 text-neutral-600"}>
                  {t("drawer.stripe_id")}
                  <span className={"text-primary-500 font-bold truncate leading-8 max-w-[20rem] text-right font-mono text-[1.2rem]"}>
                    {sub.stripeSubscriptionId}
                  </span>
                </p>
              )}
              {sub.cancelAtPeriodEnd && (
                <p className={"flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"}>
                  {t("drawer.cancel_at_end")}
                  <span className={"py-[.3rem] text-[1.1rem] font-bold leading-6 uppercase px-2 rounded-[30px] bg-[#f5f5f5] text-failure"}>
                    {t("table.status")}
                  </span>
                </p>
              )}
            </div>
          </div>
        </DrawerDescription>
      </div>

      <DrawerFooter>
        <div className={"flex gap-8"}>
          <DrawerClose asChild className={"flex-1 cursor-pointer"}>
            <ButtonAccent className={"w-full"}>
              {t("drawer.close")}
            </ButtonAccent>
          </DrawerClose>
        </div>
      </DrawerFooter>
    </DrawerContent>
  );
}
