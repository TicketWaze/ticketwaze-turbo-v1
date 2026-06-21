import AdminLayout from "@/components/Layouts/AdminLayout";
import PaymentsPageContent from "./PaymentsPageContent";
import { auth } from "@/lib/auth";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const { status } = await searchParams;
  const activeStatus = status ?? "SUCCESSFUL";
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/payments/requests?status=${activeStatus}`,
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
  return (
    <AdminLayout>
      <PaymentsPageContent
        orders={response.orders?.data ?? []}
        stats={response.stats ?? { totalRevenue: 0, totalTransactions: 0, revenueGrowth: 0, platformFees: 0 }}
        activeStatus={activeStatus}
      />
    </AdminLayout>
  );
}
