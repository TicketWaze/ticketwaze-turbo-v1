import AdminLayout from "@/components/Layouts/AdminLayout";
import { auth } from "@/lib/auth";
import PaymentsPageContent, { type PaymentsData } from "./PaymentsPageContent";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; status?: string; search?: string; page?: string }>;
}) {
  const session = await auth();
  const filters = await searchParams;

  const params = new URLSearchParams({ limit: "12" });
  for (const key of ["period", "status", "search", "page"] as const) {
    const value = filters[key];
    if (value) params.set(key, value);
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/payments-overview?${params}`,
    {
      cache: "no-store",
      headers: { Authorization: `Bearer ${session?.user.accessToken}` },
    },
  ).catch(() => null);
  const data = (await response?.json().catch(() => null)) as
    | (PaymentsData & { status: string })
    | null;

  return (
    <AdminLayout>
      <PaymentsPageContent
        data={data?.status === "success" ? data : null}
        filters={{ status: filters.status ?? null, search: filters.search ?? "" }}
      />
    </AdminLayout>
  );
}
