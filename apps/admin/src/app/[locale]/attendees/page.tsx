import { auth } from "@/lib/auth";
import AttendeesPageContent, { type AttendeesData } from "./AttendeesPageContent";

export default async function AttendeesPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    status?: string;
    joined?: string;
    search?: string;
    page?: string;
  }>;
}) {
  const session = await auth();
  const filters = await searchParams;

  const params = new URLSearchParams({ limit: "12" });
  for (const key of ["period", "status", "joined", "search", "page"] as const) {
    const value = filters[key];
    if (value) params.set(key, value);
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/attendees?${params}`,
    {
      cache: "no-store",
      headers: { Authorization: `Bearer ${session?.user.accessToken}` },
    },
  ).catch(() => null);
  const data = (await response?.json().catch(() => null)) as
    | (AttendeesData & { status: string })
    | null;

  return (
    <AttendeesPageContent
      data={data?.status === "success" ? data : null}
      filters={{
        status: filters.status ?? null,
        joined: filters.joined ?? null,
        search: filters.search ?? "",
      }}
    />
  );
}
