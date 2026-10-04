"use client";
import { useState } from "react";
import { formatMoney } from "@ticketwaze/currency";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Crown, Money3, Warning2 } from "iconsax-reactjs";
import {
  MembershipTier,
  OrganisationSubscription,
} from "@ticketwaze/typescript-config";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import ModalShell from "@/components/shared/ModalShell";
import { ButtonPill } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { GrowBar, Reveal } from "@/components/shared/motion";
import { Metric } from "@/app/[locale]/analytics/parts";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { SettingsHeader } from "../parts";
import SubscriptionDetailDrawerContent from "./SubscriptionDetailDrawerContent";

const headClass =
  "font-sans font-bold text-[1.1rem] leading-6 text-deep-100 uppercase text-left pb-6 pr-4 whitespace-nowrap";
const cellClass =
  "font-sans text-[1.5rem] leading-8 text-neutral-900 py-6 pr-4";
const STATUS_COLOURS: Record<string, string> = {
  ACTIVE: "#349C2E",
  CANCELED: "#DE0028",
  EXPIRED: "#737C8A",
};

function formatDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function StatusPill({ status, label }: { status: string; label: string }) {
  return (
    <span
      className="inline-block px-2 py-[.3rem] rounded-[3rem] bg-[#f5f5f5] font-bold text-[1.1rem] leading-6 uppercase"
      style={{ color: STATUS_COLOURS[status] ?? "#737C8A" }}
    >
      {label}
    </span>
  );
}

/**
 * Subscriptions (not in Figma — restyled to the dashboard): the Settings
 * header with Upgrade, the current plan as KPI tiles (plan, billing, renewal
 * with the elapsed bar), then the history table with the same columns, pills
 * and row panels as the other tables.
 */
export default function SubscriptionPageContent({
  organisationSubscriptions,
  membershipTier,
}: {
  organisationSubscriptions: OrganisationSubscription[];
  membershipTier: MembershipTier;
}) {
  const t = useTranslations("Settings.subscriptions");
  const { data: session } = useSession();
  const locale = useLocale();
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [detail, setDetail] = useState<OrganisationSubscription | null>(null);

  const activeSub =
    organisationSubscriptions.find((s) => s.status === "ACTIVE") ??
    organisationSubscriptions.find((s) => s.status === "CANCELED");
  const now = new Date();
  const startDate = activeSub
    ? new Date(activeSub.createdAt as unknown as string)
    : null;
  const endDate = activeSub
    ? new Date(activeSub.endsAt as unknown as string)
    : null;
  const totalMs =
    startDate && endDate ? endDate.getTime() - startDate.getTime() : 0;
  const elapsedMs = startDate
    ? Math.max(0, now.getTime() - startDate.getTime())
    : 0;
  const progress = totalMs > 0 ? Math.min(100, (elapsedMs / totalMs) * 100) : 0;
  const daysLeft = endDate
    ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / 86400000))
    : 0;
  const isTrial = activeSub?.subscriptionName?.toLowerCase().includes("trial");
  // "Cancelled" means "will not renew" — the plan runs until endDate. Our own
  // cancel writes CANCELED; Stripe's webhook may report it still active with
  // cancel_at_period_end, and either can land first.
  const isCanceled =
    activeSub?.status === "CANCELED" || activeSub?.cancelAtPeriodEnd === true;
  const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;
  const statusLabel = (status: string) =>
    status === "ACTIVE"
      ? t("status.active")
      : status === "CANCELED"
        ? t("status.canceled")
        : t("status.expired");
  const billing = !activeSub
    ? "—"
    : activeSub.paymentMethod === "stripe"
      ? t("billed_via_stripe")
      : activeSub.paymentMethod === "trial"
        ? t("billed_trial")
        : activeSub.paymentMethod === "natcash"
          ? t("billed_via_natcash")
          : t("billed_via_moncash");

  async function cancelSubscription() {
    setIsCanceling(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/organisations/${session?.activeOrganisation?.organisationId}/subscriptions`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user.accessToken ?? ""}`,
            origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
          },
        },
      );
      const data = await res.json();
      if (data.status === "success") {
        toast.success(t("cancel_success"));
        setCancelOpen(false);
        router.refresh();
      } else {
        toast.error(data.message ?? t("cancel_error"));
      }
    } catch {
      toast.error(t("cancel_error"));
    } finally {
      setIsCanceling(false);
    }
  }

  const tile = "border-neutral-100";
  return (
    <div className="flex flex-col gap-12 lg:gap-16 pb-16 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      <SettingsHeader
        title={t("title")}
        actions={
          (!activeSub ||
            isCanceled ||
            activeSub.membershipTier !== "premium") && (
            <ButtonPill
              tone="primary"
              onClick={() => router.push("/settings/subscriptions/upgrade")}
              className="px-8"
            >
              <Crown size="18" color="#fff" variant="Bulk" />
              {isCanceled ? t("resubscribe") : t("upgrade")}
            </ButtonPill>
          )
        }
      />

      {/* Current plan */}
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 border-b border-neutral-100 lg:divide-x divide-neutral-100">
          <Reveal
            className={cn(
              tile,
              "pb-8 lg:pb-10 pr-6 lg:pr-[2.5rem] max-lg:border-r",
            )}
            delay={0.06}
          >
            <Metric
              label={t("plan_label")}
              size="responsive"
              trend={
                activeSub ? (
                  <StatusPill
                    status={activeSub.status}
                    label={
                      isTrial ? t("trial_badge") : statusLabel(activeSub.status)
                    }
                  />
                ) : undefined
              }
            >
              <span className="capitalize">
                {activeSub?.membershipTier ?? membershipTier.membershipName}
              </span>
            </Metric>
          </Reveal>
          <Reveal
            className={cn(tile, "pb-8 lg:pb-10 pl-6 lg:px-[2.5rem]")}
            delay={0.11}
          >
            <Metric label={t("billing")} size="responsive">
              <span className="text-[1.6rem] lg:text-[2rem]">
                {activeSub ? billing : t("free_plan_desc")}
              </span>
            </Metric>
          </Reveal>
          <Reveal
            className={cn(
              tile,
              "py-8 lg:pt-0 lg:pb-10 lg:pl-[2.5rem] max-lg:border-t max-lg:col-span-2",
            )}
            delay={0.16}
          >
            <Metric
              label={isCanceled ? t("ends") : t("expires")}
              size="responsive"
            >
              <span className={isExpiringSoon ? "text-failure" : undefined}>
                {endDate ? formatDate(endDate, locale) : "—"}
              </span>
            </Metric>
            {activeSub && (
              <div className="mt-3 flex flex-col gap-2">
                <div className="w-full h-[.6rem] bg-neutral-100 rounded-full overflow-hidden">
                  <GrowBar
                    value={progress}
                    delay={0.3}
                    className={cn(
                      "block h-full rounded-full",
                      isExpiringSoon ? "bg-failure" : "bg-primary-500",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[1.2rem]",
                    isExpiringSoon ? "text-failure" : "text-neutral-500",
                  )}
                >
                  {daysLeft === 0
                    ? t("expires_today")
                    : daysLeft === 1
                      ? t("day_left")
                      : t("days_left", { count: daysLeft })}
                </span>
              </div>
            )}
          </Reveal>
        </div>

        {activeSub && isCanceled && endDate && (
          <Reveal
            delay={0.2}
            className="flex items-start gap-3 text-[1.3rem] leading-6 text-failure"
          >
            <Warning2
              size="16"
              variant="Bulk"
              color="#DE0028"
              className="shrink-0 mt-[.2rem]"
            />
            {t("canceled_notice", { date: formatDate(endDate, locale) })}
          </Reveal>
        )}
        {activeSub && !isCanceled && !isTrial && (
          <Reveal delay={0.2}>
            <button
              type="button"
              onClick={() => setCancelOpen(true)}
              className="text-[1.4rem] text-failure cursor-pointer hover:underline"
            >
              {t("cancel_sub")}
            </button>
          </Reveal>
        )}
      </div>

      {/* History */}
      <Reveal delay={0.24} className="flex flex-col gap-8">
        <h2 className="font-primary font-medium text-[1.8rem] leading-10 text-black">
          {t("history")}
        </h2>
        {organisationSubscriptions.length === 0 ? (
          <div className="flex flex-col items-center gap-8 py-10 text-center">
            <div className="w-[11rem] h-[11rem] rounded-full flex items-center justify-center bg-neutral-100">
              <div className="w-[8rem] h-[8rem] rounded-full flex items-center justify-center bg-neutral-200">
                <Money3 size="40" color="#0d0d0d" variant="Bulk" />
              </div>
            </div>
            <p className="text-[1.6rem] leading-[2.4rem] text-neutral-600 max-w-[40rem]">
              {t("description")}
            </p>
          </div>
        ) : (
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className={cn(headClass, "hidden lg:table-cell")}>
                  {t("table.id")}
                </th>
                <th className={headClass}>{t("table.tier")}</th>
                <th className={cn(headClass, "hidden lg:table-cell")}>
                  {t("table.amount")}
                </th>
                <th className={headClass}>{t("table.status")}</th>
                <th className={cn(headClass, "hidden lg:table-cell")}>
                  {t("table.date")}
                </th>
              </tr>
            </thead>
            <tbody>
              {organisationSubscriptions.map((sub, i) => (
                <motion.tr
                  key={sub.organisationSubscriptionId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.25,
                    delay: Math.min(i * 0.03, 0.24),
                  }}
                  onClick={() => setDetail(sub)}
                  className="border-b border-neutral-100 cursor-pointer transition-colors hover:bg-neutral-50"
                >
                  <td
                    className={cn(cellClass, "hidden lg:table-cell uppercase")}
                  >
                    {sub.organisationSubscriptionId.slice(0, 8)}
                  </td>
                  <td className={cn(cellClass, "capitalize font-medium")}>
                    {sub.membershipTier}
                  </td>
                  <td className={cn(cellClass, "hidden lg:table-cell")}>
                    {formatMoney(sub.usdAmountPaid, "USD")}
                  </td>
                  <td className={cellClass}>
                    <StatusPill
                      status={sub.status}
                      label={statusLabel(sub.status)}
                    />
                  </td>
                  <td className={cn(cellClass, "hidden lg:table-cell")}>
                    {formatDate(
                      new Date(sub.createdAt as unknown as string),
                      locale,
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </Reveal>

      <Drawer
        open={detail !== null}
        onOpenChange={(o) => !o && setDetail(null)}
        direction="right"
      >
        {detail && <SubscriptionDetailDrawerContent sub={detail} />}
      </Drawer>

      <Dialog
        open={cancelOpen}
        onOpenChange={(o) => !isCanceling && setCancelOpen(o)}
      >
        <ModalShell
          title={t("cancel_title")}
          description={t("cancel_warning")}
          className="lg:w-[46rem]"
        >
          <button
            type="button"
            onClick={cancelSubscription}
            disabled={isCanceling}
            className="w-full h-[5rem] rounded-[10rem] border-2 border-failure bg-failure/10 font-sans font-semibold text-[1.5rem] text-failure cursor-pointer hover:bg-failure/20 disabled:opacity-60 flex items-center justify-center"
          >
            {isCanceling ? <LoadingCircleSmall /> : t("cancel_confirm")}
          </button>
        </ModalShell>
      </Dialog>
    </div>
  );
}
