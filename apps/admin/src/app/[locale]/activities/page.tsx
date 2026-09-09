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

/**
 * The API now understands `status=all` and orders newest-first, so this is one
 * request. It used to fire four — one per status — at ten rows each and merge
 * them, which capped the list at the ten oldest events per status and hid
 * everything else; that is why recent activities were missing from the page.
 */
async function fetchEvents(
  status: string,
  page: string | undefined,
  search: string | undefined,
  accessToken: string | undefined,
): Promise<{ events?: AdminEventsRequest; allEvents?: Event[] }> {
  const params = new URLSearchParams({ status, limit: "100" });
  if (page) params.set("page", page);
  if (search) params.set("search", search);

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/events?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
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
  search: string | undefined,
  accessToken: string | undefined,
): Promise<{ sales?: { data?: Sale[] } }> {
  const params = new URLSearchParams({ status: "ALL", limit: "100" });
  if (search) params.set("search", search);

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/sales?${params.toString()}`,
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
  searchParams: Promise<{
    status?: string;
    page?: string;
    search?: string;
  }>;
}) {
  const session = await auth();
  const { status, page, search } = await searchParams;
  const activeStatus = status ?? "all";
  const accessToken = session?.user.accessToken;

  // Events and products are filtered in the database. Raffles and venues are
  // not: their endpoints return every row already sorted newest-first, so
  // narrowing them on the client searches the whole set, not just a page of it.
  const rafflesPromise = fetchRaffles(accessToken);
  const restaurantsPromise = fetchRestaurants(accessToken);
  const salesPromise = fetchSales(search, accessToken);

  const response = await fetchEvents(activeStatus, page, search, accessToken);
  const eventData = response.events?.data ?? [];
  const allEvents = response.allEvents ?? [];

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
        search={search}
        raffles={raffles}
        restaurants={restaurants}
        sales={sales}
      />
    </AdminLayout>
  );
}
