import { auth } from "@/lib/auth";
import AdminLayout from "@/components/Layouts/AdminLayout";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import CampaignComposer, {
  ExistingCampaign,
} from "../components/CampaignComposer";
import CampaignReport, {
  CampaignDetail,
  CampaignProgress,
  CampaignFailure,
} from "../components/CampaignReport";

/**
 * ONE ROUTE, TWO PAGES.
 *
 * A draft opens back into the composer — it is still being written, and the
 * only useful thing to show is the editor with the words already in it. Anything
 * past draft opens into the report: it can no longer be changed, and the only
 * useful thing to show is how far the send has got and who it missed.
 */
export default async function CampaignPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const session = await auth();

  let campaign: CampaignDetail | null = null;
  let progress: CampaignProgress = { pending: 0, sent: 0, failed: 0, skipped: 0 };
  let failures: CampaignFailure[] = [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/campaigns/${campaignId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user.accessToken}`,
        },
        cache: "no-store",
        signal: controller.signal,
      },
    );
    clearTimeout(timeout);
    const response = await request.json();
    // The API drops the `campaign` key entirely on an error, so this has to be
    // checked rather than destructured.
    if (response?.campaign) {
      campaign = response.campaign;
      if (response.progress) progress = response.progress;
      if (response.failures) failures = response.failures;
    }
  } catch {
    clearTimeout(timeout);
  }

  if (!campaign) {
    return (
      <AdminLayout>
        <FetchFailedErrorView />
      </AdminLayout>
    );
  }

  if (campaign.status === "draft") {
    const existing: ExistingCampaign = {
      emailCampaignId: campaign.emailCampaignId,
      name: campaign.name,
      subjectFr: campaign.subjectFr,
      subjectEn: campaign.subjectEn,
      bodyFr: campaign.bodyFr,
      bodyEn: campaign.bodyEn,
      toAllUsers: campaign.toAllUsers,
      toAllOrganisations: campaign.toAllOrganisations,
      manualEmails: campaign.manualEmails ?? [],
    };
    return (
      <AdminLayout>
        <CampaignComposer
          accessToken={session?.user.accessToken ?? ""}
          campaign={existing}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <CampaignReport
        campaign={campaign}
        initialProgress={progress}
        initialFailures={failures}
        accessToken={session?.user.accessToken ?? ""}
      />
    </AdminLayout>
  );
}
