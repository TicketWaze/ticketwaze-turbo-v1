import AdminLayout from "@/components/Layouts/AdminLayout";
import RequestPageWrapper from "./RequestPageWrapper";
import { auth } from "@/lib/auth";
import { OrganisationWithdrawalRequest } from "@ticketwaze/typescript-config";

export default async function PayoutRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page: string | undefined }>;
}) {
  const session = await auth();
  const { status, page } = await searchParams;
  const activeStatus = status ?? "PENDING";
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/payouts/requests?status=${activeStatus}&page=${page}&limit=10`,
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
      <RequestPageWrapper requests={requests} status={activeStatus} />
    </AdminLayout>
  );
}
