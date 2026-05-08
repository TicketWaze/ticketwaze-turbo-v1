import { auth } from "@/lib/auth";
import ActivitiesPageContent from "./ActivitiesPageContent";
import { AdminEventsRequest } from "@ticketwaze/typescript-config";
import AdminLayout from "@/components/Layouts/AdminLayout";

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page: string | undefined }>;
}) {
  const session = await auth();
  const { status, page } = await searchParams;
  const activeStatus = status ?? "requested";
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/events?status=${activeStatus}&page=${page}&limit=10`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    },
  );
  const response = await request.json();
  const events: AdminEventsRequest = response.events ?? {
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
  return (
    <AdminLayout>
      <ActivitiesPageContent events={events} status={activeStatus} />
    </AdminLayout>
  );
}
