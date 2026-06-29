import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { auth } from "@/lib/auth";
import UpcomingPageContent from "./UpcomingPageContent";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { Event } from "@ticketwaze/typescript-config";

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
  try {
    const eventRequest = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/upcoming`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session?.user.accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );
    const eventResponse = await eventRequest.json();
    if (eventRequest.ok && Array.isArray(eventResponse?.events)) {
      events = eventResponse.events;
    } else {
      console.error("Failed to load upcoming events:", eventResponse);
    }
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
  }

  return (
    <AttendeeLayout title="Upcoming" className="overflow-x-hidden">
      <UpcomingPageContent events={events} />
    </AttendeeLayout>
  );
}
