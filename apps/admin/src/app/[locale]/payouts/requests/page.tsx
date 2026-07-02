import AdminLayout from "@/components/Layouts/AdminLayout";
import RequestPageWrapper from "./RequestPageWrapper";
import { auth } from "@/lib/auth";

const emptyPage = {
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

export default async function PayoutRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{
    scope?: string;
    tab?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const session = await auth();
  const { scope, tab, status, page } = await searchParams;
  // scope splits pending "requests" from processed "history". Only the active
  // tab is fetched per navigation, so switching tabs / paging / filtering loads
  // just that list.
  const activeScope = scope === "history" ? "history" : "requests";
  const activeTab = tab === "user" ? "user" : "organisation";
  // "ALL" falls through to the scope filter on the API; an explicit status
  // (e.g. SUCCESSFUL) narrows within the scope.
  const activeStatus = status ?? "ALL";
  const pageNum = page ?? "1";

  const endpoint =
    activeTab === "user"
      ? "/admin/user-withdrawals/requests"
      : "/admin/payouts/requests";

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}${endpoint}?scope=${activeScope}&status=${activeStatus}&page=${pageNum}&limit=10`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    },
  );
  const response = await request.json().catch(() => ({}));
  const requests = response?.requests ?? emptyPage;

  return (
    <AdminLayout>
      <RequestPageWrapper
        scope={activeScope}
        tab={activeTab}
        requests={requests}
        status={activeStatus}
      />
    </AdminLayout>
  );
}
