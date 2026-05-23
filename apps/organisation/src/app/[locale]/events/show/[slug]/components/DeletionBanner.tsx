"use client";
import { CancelEventDeletion } from "@/actions/EventActions";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { DateTime } from "luxon";
import { CloseCircle, Warning2 } from "iconsax-reactjs";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { usePathname } from "@/i18n/navigation";

export default function DeletionBanner({
  eventId,
  scheduledDeletionAt,
  deletionReason,
  onCancelled,
}: {
  eventId: string;
  scheduledDeletionAt: string;
  deletionReason: string | null;
  onCancelled: () => void;
}) {
  const t = useTranslations("Events.single_event");
  const { data: session } = useSession();
  const locale = useLocale();
  const [isCancelling, setIsCancelling] = useState(false);
  const pathname = usePathname();

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
    const result = await CancelEventDeletion(
      eventId,
      session?.user.accessToken ?? "",
      locale,
      pathname,
    );
    setIsCancelling(false);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success(t("deletion.cancel_success"));
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
              {t("deletion.banner_title")}
            </span>
            {daysLeft > 0 && (
              <span className="text-[1.3rem] text-amber-600">
                ({daysLeft} {daysLeft === 1 ? "day" : "days"} remaining)
              </span>
            )}
          </div>
          <p className="text-[1.4rem] leading-7 text-amber-700">
            {t("deletion.banner_date")} <strong>{scheduledDate}</strong>.
          </p>
          {deletionReason && (
            <p className="text-[1.4rem] leading-7 text-amber-700">
              {t("deletion.banner_reason_label")}: &ldquo;{deletionReason}
              &rdquo;
            </p>
          )}
          <p className="text-[1.4rem] leading-7 text-amber-600">
            {t("deletion.banner_refund")}
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
            {t("deletion.cancel_cta")}
          </>
        )}
      </button>
    </div>
  );
}
