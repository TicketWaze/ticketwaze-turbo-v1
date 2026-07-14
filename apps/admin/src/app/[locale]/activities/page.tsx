import { auth } from "@/lib/auth";
import ActivitiesPageContent from "./ActivitiesPageContent";
import { AdminEventsRequest, Event, Raffle } from "@ticketwaze/typescript-config";
import AdminLayout from "@/components/Layouts/AdminLayout";

const EVENT_STATUSES = ["requested", "review", "approved", "rejected"] as const;

async function fetchEvents(
  status: string,
  page: string | undefined,
  accessToken: string | undefined,
): Promise<{ events?: AdminEventsRequest; allEvents?: Event[] }> {
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/events?status=${status}&page=${page}&limit=10`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  return request.json();
}

async function fetchRaffles(
  accessToken: string | undefined,
): Promise<{ raffles?: Raffle[] }> {
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/raffles`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  return request.json();
}

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page: string | undefined }>;
}) {
  const session = await auth();
  const { status, page } = await searchParams;
  const activeStatus = status ?? "all";
  const accessToken = session?.user.accessToken;

  let eventData: Event[] = [];
  let allEvents: Event[] = [];

  const rafflesPromise = fetchRaffles(accessToken);

  if (activeStatus === "all") {
    // The API filters by a single status, so "all" aggregates every status.
    const responses = await Promise.all(
      EVENT_STATUSES.map((s) => fetchEvents(s, page, accessToken)),
    );
    eventData = responses.flatMap((r) => r.events?.data ?? []);
    allEvents = responses.find((r) => r.allEvents)?.allEvents ?? [];
    eventData.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } else {
    const response = await fetchEvents(activeStatus, page, accessToken);
    eventData = response.events?.data ?? [];
    allEvents = response.allEvents ?? [];
  }

  const raffles = (await rafflesPromise).raffles ?? [];

  return (
    <AdminLayout>
      <ActivitiesPageContent
        eventData={eventData}
        allEvents={allEvents}
        status={activeStatus}
        raffles={raffles}
      />
    </AdminLayout>
  );
}
