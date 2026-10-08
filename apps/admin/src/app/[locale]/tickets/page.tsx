import AdminLayout from "@/components/Layouts/AdminLayout";
import { auth } from "@/lib/auth";
import TicketPageContent, { type TicketsData } from "./TicketPageContent";

export default async function TicketPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    status?: string;
    purchased?: string;
    search?: string;
    page?: string;
  }>;
}) {
  const session = await auth();
  const filters = await searchParams;

  const params = new URLSearchParams({ limit: "10" });
  for (const key of ["period", "status", "purchased", "search", "page"] as const) {
    const value = filters[key];
    if (value) params.set(key, value);
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/tickets-overview?${params}`,
    {
      cache: "no-store",
      headers: { Authorization: `Bearer ${session?.user.accessToken}` },
    },
  ).catch(() => null);
  const data = (await response?.json().catch(() => null)) as
    | (TicketsData & { status: string })
    | null;

  return (
    <AdminLayout>
      <TicketPageContent
        data={data?.status === "success" ? data : null}
        filters={{
          status: filters.status ?? null,
          purchased: filters.purchased ?? null,
          search: filters.search ?? "",
        }}
      />
    </AdminLayout>
  );
}
