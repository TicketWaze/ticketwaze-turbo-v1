import AdminLayout from "@/components/Layouts/AdminLayout";
import PaymentsPageContent from "./PaymentsPageContent";
import { auth } from "@/lib/auth";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; period?: string; search?: string }>;
}) {
  const session = await auth();
  const { status, period, search } = await searchParams;
  const activeStatus = status ?? "SUCCESSFUL";

  const params = new URLSearchParams();
  params.set("status", activeStatus);
  // A dashboard glance, not a ledger: the table shows only the most recent
  // handful. The API already orders by created_at desc, so this is the newest
  // seven. Search is unaffected — it runs its own request from the client
  // against every record, so a transaction that is not listed here is still
  // findable by name or id.
  params.set("limit", "7");
  if (period) params.set("period", period);
  if (search) params.set("search", search);

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/payments/requests?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    },
  );
  // The API omits its data keys on error, so guard before reading.
  const response = await request.json().catch(() => null);

  return (
    <AdminLayout>
      <PaymentsPageContent
        orders={response?.orders?.data ?? []}
        stats={
          response?.stats ?? {
            totalRevenue: 0,
            totalTransactions: 0,
            revenueGrowth: 0,
            platformFees: 0,
          }
        }
        activeStatus={activeStatus}
        period={period}
        search={search}
      />
    </AdminLayout>
  );
}
