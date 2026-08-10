import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { auth } from "@/lib/auth";
import UpcomingPageContent from "./UpcomingPageContent";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { Event, MyRaffle } from "@ticketwaze/typescript-config";

export default async function UpcomingPage() {
  const session = await auth();
  const locale = await getLocale();

  if (!session) {
    redirect({ href: "/auth/login", locale });
  }

  // This is an authenticated, per-user request, so never cache it. Guard every
  // failure path: the API returns `{ status: 'failed' }` (no `events`) on error
  // and middleware can return a 401, both of which previously left `events`
  // undefined and crashed the client component on `events.filter`.
  let events: Event[] = [];
  // Raffle entries are tickets against an activity with no `events` row, so
  // they never come back from /events/upcoming and are fetched separately.
  let raffles: MyRaffle[] = [];

  const headers = {
    Authorization: `Bearer ${session?.user.accessToken}`,
    "Content-Type": "application/json",
  };

  const [eventResult, raffleResult] = await Promise.allSettled([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/upcoming`, {
      method: "GET",
      headers,
      cache: "no-store",
    }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/me/raffles`, {
      method: "GET",
      headers,
      cache: "no-store",
    }),
  ]);

  if (eventResult.status === "fulfilled") {
    try {
      const eventResponse = await eventResult.value.json();
      if (eventResult.value.ok && Array.isArray(eventResponse?.events)) {
        events = eventResponse.events;
      } else {
        console.error("Failed to load upcoming events:", eventResponse);
      }
    } catch (error) {
      console.error("Error parsing upcoming events:", error);
    }
  } else {
    console.error("Error fetching upcoming events:", eventResult.reason);
  }

  if (raffleResult.status === "fulfilled") {
    try {
      const raffleResponse = await raffleResult.value.json();
      if (raffleResult.value.ok && Array.isArray(raffleResponse?.raffles)) {
        raffles = raffleResponse.raffles;
      } else {
        console.error("Failed to load upcoming raffles:", raffleResponse);
      }
    } catch (error) {
      console.error("Error parsing upcoming raffles:", error);
    }
  } else {
    console.error("Error fetching upcoming raffles:", raffleResult.reason);
  }

  return (
    <AttendeeLayout title="Upcoming" className="overflow-x-hidden">
      <UpcomingPageContent events={events} raffles={raffles} />
    </AttendeeLayout>
  );
}
