"use client";
import { LinkPrimary } from "@/components/shared/Links";
import { ButtonRed } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MembershipTier,
  OrganisationSubscription,
} from "@ticketwaze/typescript-config";
import { Calendar, Crown, Money3, Verify } from "iconsax-reactjs";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";

function formatDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-[#E8F5E9] text-[#349C2E]",
    CANCELED: "bg-[#FCE5EA] text-failure",
    EXPIRED: "bg-neutral-100 text-neutral-500",
  };
  return (
    <span
      className={`text-[1.1rem] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${map[status] ?? "bg-neutral-100 text-neutral-500"}`}
    >
      {status}
    </span>
  );
}

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
  const closeRef = useRef<HTMLButtonElement>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  const activeSub = organisationSubscriptions.find(
    (s) => s.status === "ACTIVE" || s.status === "CANCELED",
  );

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
  const isPremium =
    activeSub?.membershipTier === "premium" ||
    membershipTier.membershipName === "premium";
  const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;

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
        closeRef.current?.click();
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

  return (
    <div className=" flex-col gap-12 overflow-y-scroll ">
      {/* ── SUBSCRIPTION STATUS CARD ── */}
      {activeSub ? (
        <div
          className={`rounded-[2.4rem] overflow-x-hidden mb-12 ${isPremium ? "p-[.2rem] bg-linear-to-br from-primary-500 via-[#E752AE] to-[#DD068B]" : ""}`}
        >
          <div
            className={`rounded-[${isPremium ? "22px" : "24px"}] overflow-hidden ${isPremium ? "" : "border border-neutral-200"}`}
          >
            {/* Card header */}
            <div
              className={`px-8 pt-8 pb-6 flex items-start justify-between gap-4 ${
                isPremium
                  ? "bg-linear-to-br from-primary-500 via-[#E752AE] to-[#DD068B]"
                  : "bg-primary-900"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <Crown size="22" color="#fff" variant="Bulk" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-white font-primary font-medium text-[2.4rem] leading-none capitalize">
                      {activeSub.membershipTier}
                    </h2>
                    {isTrial && (
                      <span className="text-[1rem] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/20 text-white">
                        {t("trial_badge")}
                      </span>
                    )}
                  </div>
                  <p className="text-white/60 text-[1.3rem] mt-1 capitalize">
                    {activeSub.paymentMethod === "stripe"
                      ? t("billed_via_stripe")
                      : activeSub.paymentMethod === "trial"
                        ? t("billed_trial")
                        : t("billed_via_moncash")}
                    {/* {activeSub.usdAmountPaid > 0 && (
                      <> · ${activeSub.usdAmountPaid.toFixed(2)}</>
                    )} */}
                  </p>
                </div>
              </div>
              <StatusBadge status={activeSub.status} />
            </div>

            {/* Card body */}
            <div className="bg-white px-8 py-7 flex flex-col gap-6">
              {/* Dates row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                    <Calendar size="16" color="#737c8a" variant="Bulk" />
                  </div>
                  <div>
                    <p className="text-[1.1rem] text-neutral-400 uppercase tracking-widest font-medium">
                      {t("started")}
                    </p>
                    <p className="text-[1.4rem] font-medium text-black">
                      {startDate ? formatDate(startDate, locale) : "—"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[1.1rem] text-neutral-400 uppercase tracking-widest font-medium">
                    {t("expires")}
                  </p>
                  <p
                    className={`text-[1.4rem] font-medium ${isExpiringSoon ? "text-failure" : "text-black"}`}
                  >
                    {endDate ? formatDate(endDate, locale) : "—"}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex flex-col gap-2">
                <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isExpiringSoon
                        ? "bg-failure"
                        : isPremium
                          ? "bg-linear-to-r from-primary-500 via-[#E752AE] to-[#DD068B]"
                          : "bg-primary-900"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[1.2rem] text-neutral-400">
                    {Math.round(progress)}% {t("elapsed")}
                  </span>
                  <span
                    className={`text-[1.3rem] font-medium ${
                      isExpiringSoon ? "text-failure" : "text-black"
                    }`}
                  >
                    {daysLeft === 0
                      ? t("expires_today")
                      : daysLeft === 1
                        ? t("day_left")
                        : t("days_left", { count: daysLeft })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center w-full gap-4 pt-2 border-t border-neutral-100">
                {activeSub.stripeSubscriptionId && (
                  <button
                    // href="#"
                    onClick={async (e) => {
                      e.preventDefault();
                      try {
                        const res = await fetch(
                          `${process.env.NEXT_PUBLIC_API_URL}/organisations/${session?.activeOrganisation?.organisationId}/billing-portal`,
                          {
                            method: "POST",
                            headers: {
                              Authorization: `Bearer ${session?.user.accessToken ?? ""}`,
                              origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
                            },
                          },
                        );
                        const data = await res.json();
                        if (data.url) window.location.href = data.url;
                      } catch {
                        toast.error(t("cancel_error"));
                      }
                    }}
                    className="flex-1 flex w-full items-center justify-center gap-2 px-6 py-4 rounded-full border border-neutral-200 text-[1.3rem] font-medium text-black hover:border-primary-500 hover:text-primary-500 transition-colors"
                  >
                    <Verify size="16" color="currentColor" variant="Bulk" />
                    {t("manage_billing")}
                  </button>
                )}

                {!activeSub.cancelAtPeriodEnd ||
                  (isTrial && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="flex-1 w-full flex items-center justify-center gap-2 px-6 py-4 rounded-full border border-failure/30 text-failure text-[1.3rem] font-medium hover:bg-[#FCE5EA] transition-colors cursor-pointer">
                          {t("cancel_sub")}
                        </button>
                      </DialogTrigger>
                      <DialogContent className="w-xl lg:w-3xl">
                        <DialogHeader>
                          <DialogTitle className="font-medium border-b border-neutral-100 pb-8 text-[2.2rem] leading-12 text-black font-primary">
                            {t("cancel_title")}
                          </DialogTitle>
                          <DialogDescription className="sr-only">
                            Cancel subscription
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-6">
                          <p className="text-[1.5rem] leading-7 text-neutral-600">
                            {t("cancel_warning")}
                          </p>
                        </div>
                        <DialogFooter className="flex flex-col gap-3">
                          <ButtonRed
                            onClick={cancelSubscription}
                            disabled={isCanceling}
                            className="w-full"
                          >
                            {isCanceling ? (
                              <LoadingCircleSmall />
                            ) : (
                              t("cancel_confirm")
                            )}
                          </ButtonRed>
                          <DialogClose
                            ref={closeRef}
                            className="w-full px-12 py-5 rounded-[100px] text-[1.5rem] font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer"
                          >
                            {t("cancel_back")}
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Free plan — no active subscription */
        <div className="rounded-[2.4rem] bg-neutral-100 mb-12 p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center shrink-0">
              <Crown size="22" color="#737c8a" variant="Bulk" />
            </div>
            <div>
              <p className="text-[1.6rem] font-medium text-black capitalize">
                {membershipTier.membershipName} {t("plan_label")}
              </p>
              <p className="text-[1.3rem] text-neutral-500 mt-0.5">
                {t("free_plan_desc")}
              </p>
            </div>
          </div>
          <div className="p-[.2rem] rounded-[30px] bg-linear-to-r from-primary-500 w-full lg:w-auto via-[#E752AE] to-[#DD068B] shrink-0">
            <LinkPrimary
              className="bg-transparent gap-4 items-center whitespace-nowrap"
              href="/settings/subscriptions/upgrade"
            >
              <Crown size="18" color="#fff" variant="Bulk" />
              {t("upgrade")}
            </LinkPrimary>
          </div>
        </div>
      )}

      {/* ── SUBSCRIPTION HISTORY ── */}
      <div className="flex flex-col gap-8">
        <span className="font-primary font-medium text-[18px] leading-10 text-black">
          {t("history")}
        </span>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
                {t("table.id")}
              </TableHead>
              <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
                {t("table.tier")}
              </TableHead>
              <TableHead className="font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
                {t("table.amount")}
              </TableHead>
              <TableHead className="font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
                {t("table.status")}
              </TableHead>
              <TableHead className="font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
                {t("table.date")}
              </TableHead>
            </TableRow>
          </TableHeader>
        </Table>

        {true && (
          <div className="w-132 lg:w-184 mx-auto flex flex-col items-center gap-20">
            <div className="w-48 h-48 rounded-full flex items-center justify-center bg-neutral-100">
              <div className="w-36 h-36 rounded-full flex items-center justify-center bg-neutral-200">
                <Money3 size="50" color="#0d0d0d" variant="Bulk" />
              </div>
            </div>
            <p className="text-[1.8rem] leading-10 text-neutral-600 max-w-132 lg:max-w-[42.2rem] text-center">
              {t("description")}
            </p>
          </div>
        )}
        <div />
      </div>
    </div>
  );
}
