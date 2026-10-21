import AdminLayout from "@/components/Layouts/AdminLayout";
import { auth } from "@/lib/auth";
import PartnersPageContent, { type PartnersData } from "./PartnersPageContent";

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ partner?: string; status?: string; search?: string; page?: string }>;
}) {
  const session = await auth();
  const filters = await searchParams;

  const params = new URLSearchParams({ limit: "12" });
  for (const key of ["partner", "status", "search", "page"] as const) {
    const value = filters[key];
    if (value) params.set(key, value);
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/partners-overview?${params}`,
    {
      cache: "no-store",
      headers: { Authorization: `Bearer ${session?.user.accessToken}` },
    },
  ).catch(() => null);
  const data = (await response?.json().catch(() => null)) as
    | (PartnersData & { status: string })
    | null;

  return (
    <AdminLayout>
      <PartnersPageContent
        data={data?.status === "success" ? data : null}
        filters={{
          partner: filters.partner ?? null,
          status: filters.status ?? null,
          search: filters.search ?? "",
        }}
      />
    </AdminLayout>
  );
}
