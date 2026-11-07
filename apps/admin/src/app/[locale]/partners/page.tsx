import AdminLayout from "@/components/Layouts/AdminLayout";
import { auth } from "@/lib/auth";
import PartnersPageContent, { type PartnersData } from "./PartnersPageContent";
import type { ManagedPartner } from "./PartnerManager";

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

  const headers = { Authorization: `Bearer ${session?.user.accessToken}` };
  /* The settings (keys, webhook) only for `partners.manage`; the API checks it again. */
  const canManage = ((session?.user.effectivePermissionKeys ?? []) as string[]).includes(
    "partners.manage",
  );
  const [response, managedResponse] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/partners-overview?${params}`, {
      cache: "no-store",
      headers,
    }).catch(() => null),
    canManage
      ? fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/partners`, {
          cache: "no-store",
          headers,
        }).catch(() => null)
      : null,
  ]);
  const data = (await response?.json().catch(() => null)) as
    | (PartnersData & { status: string })
    | null;
  const managed = (await managedResponse?.json().catch(() => null)) as
    | { status: string; partners: ManagedPartner[] }
    | null;

  return (
    <AdminLayout>
      <PartnersPageContent
        data={data?.status === "success" ? data : null}
        managed={managed?.status === "success" ? managed.partners : null}
        filters={{
          partner: filters.partner ?? null,
          status: filters.status ?? null,
          search: filters.search ?? "",
        }}
      />
    </AdminLayout>
  );
}
