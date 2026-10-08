"use client";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { AddReportEvent } from "@/actions/eventActions";
import { usePathname } from "@/i18n/navigation";
import ReportDialog from "@/components/activity/ReportDialog";

/** "Report activity" row of the ⋯ More menu (any activity type). */
export default function ReportEventComponent({
  activityId,
  organisationId,
}: {
  activityId: string;
  organisationId: string;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const locale = useLocale();
  return (
    <ReportDialog
      kind="activity"
      send={async (message) => {
        const result = await AddReportEvent(
          session?.user.accessToken ?? "",
          activityId,
          pathname,
          { message, organisationId },
          locale,
        );
        return result.status === "success" ? null : (result.message ?? "Error");
      }}
    />
  );
}
