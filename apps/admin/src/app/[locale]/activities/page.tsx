import { auth } from "@/lib/auth";
import ActivitiesPageContent from "./ActivitiesPageContent";
import {
  AdminEventsRequest,
  Event,
  Raffle,
  Restaurant,
  Sale,
} from "@ticketwaze/typescript-config";
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

async function fetchRestaurants(
  accessToken: string | undefined,
): Promise<{ restaurants?: Restaurant[] }> {
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/restaurants`,
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

/**
 * Every product, not just the queue.
 *
 * `status=ALL` because this list is filtered client-side like raffles and
 * venues, and because an admin looking for a product they rejected yesterday
 * should find it here rather than nowhere.
 */
async function fetchSales(
  accessToken: string | undefined,
): Promise<{ sales?: { data?: Sale[] } }> {
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/sales?status=ALL&limit=100`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  // The API omits its data keys on error, so guard before reading.
  return request.json().catch(() => ({}));
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
  const restaurantsPromise = fetchRestaurants(accessToken);
  const salesPromise = fetchSales(accessToken);

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
  const restaurants = (await restaurantsPromise).restaurants ?? [];
  // Paginated by the API, unlike raffles and venues.
  const sales = (await salesPromise).sales?.data ?? [];

  return (
    <AdminLayout>
      <ActivitiesPageContent
        eventData={eventData}
        allEvents={allEvents}
        status={activeStatus}
        raffles={raffles}
        restaurants={restaurants}
        sales={sales}
      />
    </AdminLayout>
  );
}
