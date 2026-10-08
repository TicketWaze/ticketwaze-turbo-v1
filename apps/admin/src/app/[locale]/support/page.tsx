import AdminLayout from "@/components/Layouts/AdminLayout";
import { auth } from "@/lib/auth";
import SupportPageContent, { type SupportThreadsResponse } from "./SupportPageContent";

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; resolved?: string; search?: string }>;
}) {
  const session = await auth();
  const { page, resolved = "false", search = "" } = await searchParams;

  const params = new URLSearchParams({ page: page ?? "1", limit: "15", resolved });
  if (search) params.set("search", search);

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/support?${params}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${session?.user.accessToken}` },
  }).catch(() => null);
  const data = await response?.json().catch(() => null);
  const threads: SupportThreadsResponse = data?.threads ?? {
    data: [],
    meta: { total: 0, perPage: 15, currentPage: 1, lastPage: 1 },
  };

  return (
    <AdminLayout>
      <SupportPageContent threads={threads} filters={{ resolved, search }} />
    </AdminLayout>
  );
}
