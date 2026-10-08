import { auth } from "@/lib/auth";
import ActivitiesPageContent, { type ActivitiesData } from "./ActivitiesPageContent";

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    type?: string;
    status?: string;
    created?: string;
    search?: string;
    page?: string;
  }>;
}) {
  const session = await auth();
  const filters = await searchParams;

  const params = new URLSearchParams({ limit: "12" });
  for (const key of ["period", "type", "status", "created", "search", "page"] as const) {
    const value = filters[key];
    if (value) params.set(key, value);
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/activities?${params}`,
    {
      cache: "no-store",
      headers: { Authorization: `Bearer ${session?.user.accessToken}` },
    },
  ).catch(() => null);
  const data = (await response?.json().catch(() => null)) as
    | (ActivitiesData & { status: string })
    | null;

  return (
    <ActivitiesPageContent
      data={data?.status === "success" ? data : null}
      filters={{
        type: filters.type ?? null,
        status: filters.status ?? null,
        created: filters.created ?? null,
        search: filters.search ?? "",
      }}
    />
  );
}
