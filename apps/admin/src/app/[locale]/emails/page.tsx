import { auth } from "@/lib/auth";
import AdminLayout from "@/components/Layouts/AdminLayout";
import EmailsPageContent, { CampaignSummary } from "./components/EmailsPageContent";

export default async function EmailsPage() {
  const session = await auth();

  let campaigns: CampaignSummary[] = [];
  let failed = false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/campaigns?limit=100&page=1`,
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
    /**
     * The API omits `campaigns` entirely on an error or a 403 rather than
     * returning an empty one, so reading `.data` off it unguarded crashes the
     * page instead of showing the empty state.
     */
    if (response?.campaigns?.data) campaigns = response.campaigns.data;
    else failed = true;
  } catch {
    clearTimeout(timeout);
    failed = true;
  }

  return (
    <AdminLayout>
      <EmailsPageContent
        campaigns={campaigns}
        failed={failed}
        accessToken={session?.user.accessToken ?? ""}
      />
    </AdminLayout>
  );
}
