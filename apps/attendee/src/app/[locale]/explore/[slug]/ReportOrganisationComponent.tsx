"use client";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { AddReportOrganisation } from "@/actions/eventActions";
import { usePathname } from "@/i18n/navigation";
import ReportDialog from "@/components/activity/ReportDialog";

/** "Report organisation" row of the ⋯ More menu. */
export default function ReportOrganisationComponent({
  organisationId,
}: {
  organisationId: string;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const locale = useLocale();
  return (
    <ReportDialog
      kind="organisation"
      send={async (message) => {
        const result = await AddReportOrganisation(
          session?.user.accessToken ?? "",
          organisationId,
          pathname,
          { message },
          locale,
        );
        return result.status === "success" ? null : (result.message ?? "Error");
      }}
    />
  );
}
