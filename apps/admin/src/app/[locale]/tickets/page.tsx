import AdminLayout from "@/components/Layouts/AdminLayout";
import TicketPageContent from "./TicketPageContent";
import { auth } from "@/lib/auth";

export default async function TicketPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; period?: string; search?: string }>;
}) {
  const session = await auth();
  const { status, period, search } = await searchParams;
  const activeStatus = status ?? "PENDING";

  const params = new URLSearchParams();
  params.set("status", activeStatus);
  // Same as the payments table: newest seven only. Search runs its own
  // client-side request across every record, so nothing becomes unfindable.
  params.set("limit", "7");
  if (period) params.set("period", period);
  if (search) params.set("search", search);

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/tickets/requests?${params.toString()}`,
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
      <TicketPageContent
        tickets={response?.tickets?.data ?? []}
        stats={response?.stats ?? { total: 0, returned: 0, checkedIn: 0 }}
        activeStatus={activeStatus}
        period={period}
        search={search}
      />
    </AdminLayout>
  );
}
