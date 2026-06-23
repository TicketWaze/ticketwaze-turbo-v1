import AdminLayout from "@/components/Layouts/AdminLayout";
import UserWithdrawalRequestsPageWrapper from "./UserWithdrawalRequestsPageWrapper";
import { auth } from "@/lib/auth";
import { UserWithdrawalRequestsPage as UserWithdrawalRequestsPageType } from "@ticketwaze/typescript-config";

export default async function UserWithdrawalRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const session = await auth();
  const { status, page } = await searchParams;
  const activeStatus = status ?? "PENDING";
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/user-withdrawals/requests?status=${activeStatus}&page=${page ?? 1}&limit=10`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    },
  );
  const json = await res.json();
  const requests: UserWithdrawalRequestsPageType = json.requests ?? {
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
      <UserWithdrawalRequestsPageWrapper
        requests={requests}
        status={activeStatus}
      />
    </AdminLayout>
  );
}
