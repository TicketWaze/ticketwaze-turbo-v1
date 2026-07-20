import { auth } from "@/lib/auth";
import AttendeesPageContent from "./AttendeesPageContent";
import {
  AdminAttendeesRequest,
  AdminAttendeeStats,
} from "@ticketwaze/typescript-config";

export default async function AttendeesPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    page?: string;
    period?: string;
    search?: string;
  }>;
}) {
  const session = await auth();
  const { status, page, period, search } = await searchParams;

  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page) params.set("page", page);
  if (period) params.set("period", period);
  if (search) params.set("search", search);
  params.set("limit", "10");

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/attendees?${params.toString()}`,
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

  const users: AdminAttendeesRequest = response.users ?? {
    data: [],
    meta: {
      total: 0,
      perPage: 10,
      currentPage: 1,
      lastPage: 1,
      firstPage: 1,
      firstPageUrl: null,
      lastPageUrl: null,
      nextPageUrl: null,
      previousPageUrl: null,
    },
  };
  const stats: AdminAttendeeStats = response.stats ?? {
    total: 0,
    active: 0,
    guest: 0,
  };

  return (
    <AttendeesPageContent
      users={users}
      stats={stats}
      status={status}
      period={period}
      search={search}
    />
  );
}
