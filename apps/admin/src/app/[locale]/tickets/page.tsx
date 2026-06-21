import AdminLayout from "@/components/Layouts/AdminLayout";
import TicketPageContent from "./TicketPageContent";
import { auth } from "@/lib/auth";

export default async function TicketPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const { status } = await searchParams;
  const activeStatus = status ?? "PENDING";
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/tickets/requests?status=${activeStatus}`,
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
      <TicketPageContent
        allTickets={response.allTickets ?? []}
        tickets={response.tickets?.data ?? []}
        activeStatus={activeStatus}
      />
    </AdminLayout>
  );
}
