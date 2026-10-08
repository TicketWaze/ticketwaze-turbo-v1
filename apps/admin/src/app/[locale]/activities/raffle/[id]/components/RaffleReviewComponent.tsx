"use client";
import { useState } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Raffle } from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import { ReceiptDiscount, Status, Trash } from "iconsax-reactjs";
import formatRaffleDate from "@/lib/formatRaffleDate";
import { RaffleStatusDialog, StatusBadge } from "./RaffleStatusDialog";
import RefundActivityDialog from "@/components/shared/RefundActivityDialog";
import FeesHandlerDialog from "@/components/shared/FeesHandlerDialog";
import ActivityActionsMenu from "@/components/shared/ActivityActionsMenu";
import ActivityHeaderActions, {
  ActivitySuspensionNotice,
} from "@/components/shared/ActivityHeaderActions";
import ActivityDetailShell, { InfoList, InfoRow } from "@/components/shared/ActivityDetailShell";
import useAdminCan from "@/lib/useAdminCan";

/**
 * Why the refund action is unavailable, or null when it is offered. Mirrors the
 * API's guards in services/activity_refund.ts — the API decides, this only
 * explains the answer without a round trip.
 */
function raffleRefundBlockedReason(raffle: Raffle): string | null {
  if (raffle.drawnAt)
    return "This raffle has already been drawn and cannot be refunded.";
  if (raffle.status === "cancelled")
    return "This raffle has already been cancelled.";
  if (raffle.deletionStatus) return "This raffle is being deleted.";
  return null;
}

/**
 * The raffle page on the shared Figma activity layout (ActivityDetailShell):
 * Suspend + Edit in the header, status / fees / refund in the ⋯ menu, the
 * figures in "Raffle performance" and the prizes in their own tab.
 */
export default function RaffleReviewComponent({
  raffle,
  organisation,
  entriesSold,
}: {
  raffle: Raffle;
  organisation: {
    organisationName: string;
    profileImageUrl: string | null;
    isVerified?: boolean;
    followersCount?: number;
    isSuspended?: boolean;
  } | null;
  entriesSold: number;
}) {
  const locale = useLocale();
  const canManage = useAdminCan("activity.manage");
  const [dialog, setDialog] = useState<null | "status" | "fees" | "refund">(null);
  const price = raffle.currency === "USD" ? raffle.usdPrice : raffle.ticketPrice;
  const suspension = raffle as Raffle & {
    suspendedAt?: string | null;
    suspensionReason?: string | null;
  };
  const control = (kind: "status" | "fees" | "refund") => ({
    hideTrigger: true,
    open: dialog === kind,
    onOpenChange: (next: boolean) => setDialog(next ? kind : null),
  });
  const date = (iso: string | null | undefined) =>
    iso ? formatRaffleDate(iso, locale, raffle.timezone) : "-";

  return (
    <>
      <ActivityDetailShell
        title={raffle.title}
        badges={<StatusBadge status={raffle.adminStatus} />}
        actions={
          <ActivityHeaderActions
            kind="raffle"
            activityId={raffle.raffleId}
            editHref={`/activities/raffle/${raffle.raffleId}/edit`}
            editLabel="Edit raffle"
            editDisabledReason={
              raffle.drawnAt
                ? "This raffle has already been drawn and can no longer be edited."
                : null
            }
            suspendedAt={suspension.suspendedAt}
          >
            <ActivityActionsMenu
              label="Actions"
              actions={[
                {
                  key: "status",
                  label: "Change status",
                  onSelect: () => setDialog("status"),
                  icon: <Status size="20" variant="Bulk" color="#2E3237" />,
                },
                canManage && {
                  key: "fees",
                  label: "Fees",
                  onSelect: () => setDialog("fees"),
                  icon: <ReceiptDiscount size="20" variant="Bulk" color="#2E3237" />,
                },
                {
                  key: "refund",
                  label: "Cancel & refund",
                  onSelect: () => setDialog("refund"),
                  icon: <Trash size="20" variant="Bulk" color="#DE0028" />,
                  danger: true,
                  disabledReason: raffleRefundBlockedReason(raffle),
                },
              ]}
            />
          </ActivityHeaderActions>
        }
        notices={
          <>
            <ActivitySuspensionNotice
              suspendedAt={suspension.suspendedAt}
              reason={suspension.suspensionReason}
              organisationSuspended={organisation?.isSuspended === true}
            />
            {raffle.adminStatus === "rejected" && raffle.rejectionReason && (
              <div className="flex flex-col gap-2 rounded-[15px] border border-failure/30 bg-[#FCE5EA] p-6">
                <span className="text-[1.4rem] font-medium text-failure">Rejection reason</span>
                <p className="text-[1.4rem] leading-8 text-neutral-700">{raffle.rejectionReason}</p>
              </div>
            )}
          </>
        }
        imageUrl={raffle.coverImageUrl}
        aboutTitle="About raffle"
        aboutHtml={raffle.description}
        organisation={
          organisation ? { ...organisation, organisationId: raffle.organisationId } : null
        }
        details={[
          { icon: "calendar", text: `Draw: ${date(raffle.drawAt)}`, wide: true },
          {
            icon: "clock",
            text: `Sales: ${date(raffle.salesStartAt)} - ${date(raffle.salesEndAt)}`,
            wide: true,
          },
        ]}
        tabs={[
          {
            value: "performance",
            label: "Raffle performance",
            content: (
              <InfoList>
                <InfoRow label="Entry price">{formatMoney(price, raffle.currency, locale)}</InfoRow>
                <InfoRow label="Entries sold">
                  {raffle.totalTicketsLimit !== null
                    ? `${entriesSold.toLocaleString()} / ${raffle.totalTicketsLimit.toLocaleString()}`
                    : entriesSold.toLocaleString()}
                </InfoRow>
                <InfoRow label="Entries left">
                  {raffle.totalTicketsLimit !== null
                    ? `${Math.max(raffle.totalTicketsLimit - entriesSold, 0).toLocaleString()} / ${raffle.totalTicketsLimit.toLocaleString()}`
                    : "Unlimited"}
                </InfoRow>
                <InfoRow label="Draw date">{date(raffle.drawAt)}</InfoRow>
                <InfoRow label="Draw mode">
                  {raffle.drawMode === "automatic" ? "Automatic" : "Manual"}
                </InfoRow>
                <InfoRow label="Drawn">{raffle.drawnAt ? date(raffle.drawnAt) : "Not yet"}</InfoRow>
              </InfoList>
            ),
          },
          {
            value: "prizes",
            label: `Prizes (${raffle.prizes.length})`,
            content: (
              <ul className="flex flex-col gap-4 pt-4">
                {[...raffle.prizes]
                  .sort((a, b) => a.rank - b.rank)
                  .map((prize) => (
                    <li
                      key={prize.rafflePrizeId}
                      className="flex items-start gap-4 rounded-[15px] border border-neutral-100 p-6"
                    >
                      {/* The picture is part of what is being reviewed, so it
                          has to be visible here and not just to buyers. */}
                      {prize.imageUrl ? (
                        <Image
                          src={prize.imageUrl}
                          alt={prize.title}
                          width={48}
                          height={48}
                          className="shrink-0 w-12 h-12 rounded-[0.8rem] object-cover"
                        />
                      ) : (
                        <span className="shrink-0 w-12 h-12 rounded-full bg-primary-50 text-primary-500 font-bold flex items-center justify-center text-[1.4rem]">
                          {prize.rank}
                        </span>
                      )}
                      <div className="flex flex-col gap-1 min-w-0">
                        <p className="text-[1.6rem] font-medium leading-8 text-deep-100">
                          {prize.imageUrl ? `${prize.rank}. ` : ""}
                          {prize.title}
                        </p>
                        <p className="text-[1.3rem] leading-6 text-neutral-600">
                          {prize.description || "No description"}
                        </p>
                      </div>
                    </li>
                  ))}
              </ul>
            ),
          },
        ]}
      />

      <RaffleStatusDialog raffle={raffle} {...control("status")} />
      <FeesHandlerDialog kind="raffle" activityId={raffle.raffleId} {...control("fees")} />
      <RefundActivityDialog
        activityKind="raffle"
        activityId={raffle.raffleId}
        activityName={raffle.title}
        ticketsSold={entriesSold}
        disabledReason={raffleRefundBlockedReason(raffle)}
        {...control("refund")}
      />
    </>
  );
}
