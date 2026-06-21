import { auth } from "@/lib/auth";
import OrganisationsPageContent from "./OrganisationsPageContent";
import {
  AdminOrganisationsRequest,
  AdminOrganisationStats,
} from "@ticketwaze/typescript-config";

export default async function OrganisationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    page?: string;
    period?: string;
  }>;
}) {
  const session = await auth();
  const { status, page, period } = await searchParams;

  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page) params.set("page", page);
  if (period) params.set("period", period);
  params.set("limit", "10");

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/organisations?${params.toString()}`,
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

  const organisations: AdminOrganisationsRequest = response.organisations ?? {
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
  const stats: AdminOrganisationStats = response.stats ?? {
    total: 0,
    active: 0,
    new: 0,
  };

  return (
    <OrganisationsPageContent
      organisations={organisations}
      stats={stats}
      status={status}
      period={period}
    />
  );
}
