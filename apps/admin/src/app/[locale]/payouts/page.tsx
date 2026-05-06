import AdminLayout from "@/components/Layouts/AdminLayout";
import PayoutsPageContent from "./PayoutsPageContent";
import { auth } from "@/lib/auth";
import { OrganisationWithdrawalRequest } from "@ticketwaze/typescript-config";

export default async function PayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const { status } = await searchParams;
  const activeStatus = status ?? "PENDING";
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/payouts/requests?status=${activeStatus}`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    },
  );
  const response = await request.json();
  const requests: OrganisationWithdrawalRequest = response.requests ?? {
    data: [],
    meta: {
      total: 0,
      perPage: 10,
      currentPage: 1,
      lastPage: 1,
      firstPage: 1,
      firstPageUrl: null,
      lastPageUrl: null,
      nextPageUrl: null,
      previousPageUrl: null,
    },
  };
  return (
    <AdminLayout>
      <PayoutsPageContent requests={requests} status={activeStatus} />
    </AdminLayout>
  );
}
