"use client";
import { CancelRaffleDeletion } from "@/actions/EventActions";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { DateTime } from "luxon";
import { CloseCircle, Warning2 } from "iconsax-reactjs";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

export default function RaffleDeletionBanner({
  organisationId,
  raffleId,
  scheduledDeletionAt,
  deletionReason,
  onCancelled,
}: {
  organisationId: string;
  raffleId: string;
  scheduledDeletionAt: string;
  deletionReason: string | null;
  onCancelled: () => void;
}) {
  const t = useTranslations("Raffles.single_raffle.deletion");
  const { data: session } = useSession();
  const locale = useLocale();
  const [isCancelling, setIsCancelling] = useState(false);

  const scheduledDate = DateTime.fromISO(scheduledDeletionAt).toLocaleString(
    DateTime.DATE_FULL,
  );
  const daysLeft = Math.max(
    0,
    Math.ceil(
      DateTime.fromISO(scheduledDeletionAt).diff(DateTime.now(), "days").days,
    ),
  );

  async function handleCancel() {
    setIsCancelling(true);
    const result = await CancelRaffleDeletion(
      organisationId,
      raffleId,
      session?.user.accessToken ?? "",
      locale,
    );
    setIsCancelling(false);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success(t("cancel_success"));
      onCancelled();
    }
  }

  return (
    <div className="flex flex-col gap-6 bg-amber-50 border border-amber-300 rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <Warning2
          size="24"
          color="#D97706"
          variant="Bulk"
          className="shrink-0 mt-1"
        />
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-3">
            <span className="font-medium text-[1.6rem] leading-8 text-amber-800">
              {t("banner_title")}
            </span>
            {daysLeft > 0 && (
              <span className="text-[1.3rem] text-amber-600">
                ({daysLeft} {daysLeft === 1 ? "day" : "days"} remaining)
              </span>
            )}
          </div>
          <p className="text-[1.4rem] leading-7 text-amber-700">
            {t("banner_date")} <strong>{scheduledDate}</strong>.
          </p>
          {deletionReason && (
            <p className="text-[1.4rem] leading-7 text-amber-700">
              {t("banner_reason_label")}: &ldquo;{deletionReason}&rdquo;
            </p>
          )}
          <p className="text-[1.4rem] leading-7 text-amber-600">
            {t("banner_refund")}
          </p>
        </div>
      </div>
      <button
        onClick={handleCancel}
        disabled={isCancelling}
        className="self-start flex items-center gap-2 px-6 py-3 rounded-[100px] border-2 border-amber-500 text-amber-700 text-[1.4rem] font-medium leading-8 hover:bg-amber-100 transition-colors disabled:opacity-50 cursor-pointer"
      >
        {isCancelling ? (
          <LoadingCircleSmall />
        ) : (
          <>
            <CloseCircle size="16" color="#B45309" variant="Bulk" />
            {t("cancel_cta")}
          </>
        )}
      </button>
    </div>
  );
}
