import AdminLayout from "@/components/Layouts/AdminLayout";
import PayoutsPageContent from "./PayoutsPageContent";
import { auth } from "@/lib/auth";
import { WithdrawalRequest } from "@ticketwaze/typescript-config";

export type PayoutsSummary = {
  totalPaidUsd: number;
  totalPaidCount: number;
  pendingOrganisationUsd: number;
  pendingOrganisationCount: number;
  pendingUserUsd: number;
  pendingUserCount: number;
};

const emptySummary: PayoutsSummary = {
  totalPaidUsd: 0,
  totalPaidCount: 0,
  pendingOrganisationUsd: 0,
  pendingOrganisationCount: 0,
  pendingUserUsd: 0,
  pendingUserCount: 0,
};

export default async function PayoutsPage() {
  const session = await auth();
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.user.accessToken}`,
  };

  // Load the summary plus the default (organisation) tab of both the Requests
  // (pending) and History (processed) sections. The Users tab of each section
  // is fetched lazily on first open, so we don't hit every list up front.
  const [summaryRes, reqOrgRes, histOrgRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/payouts/summary`, {
      method: "GET",
      cache: "no-store",
      headers,
    }),
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/payouts/requests?scope=requests&order=desc&limit=5&page=1`,
      { method: "GET", cache: "no-store", headers },
    ),
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/payouts/requests?scope=history&order=desc&limit=5&page=1`,
      { method: "GET", cache: "no-store", headers },
    ),
  ]);

  const summaryJson = await summaryRes.json().catch(() => ({}));
  const reqOrgJson = await reqOrgRes.json().catch(() => ({}));
  const histOrgJson = await histOrgRes.json().catch(() => ({}));

  const summary: PayoutsSummary = summaryJson?.summary ?? emptySummary;
  const requestOrganisation: WithdrawalRequest[] = reqOrgJson?.requests?.data ?? [];
  const requestOrganisationTotal: number = reqOrgJson?.requests?.meta?.total ?? 0;
  const historyOrganisation: WithdrawalRequest[] = histOrgJson?.requests?.data ?? [];
  const historyOrganisationTotal: number = histOrgJson?.requests?.meta?.total ?? 0;

  return (
    <AdminLayout>
      <PayoutsPageContent
        summary={summary}
        requestOrganisation={requestOrganisation}
        requestOrganisationTotal={requestOrganisationTotal}
        historyOrganisation={historyOrganisation}
        historyOrganisationTotal={historyOrganisationTotal}
      />
    </AdminLayout>
  );
}
