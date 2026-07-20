import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import ExplorePageContent from "./ExplorePageContent";
import { Event, Raffle, Restaurant } from "@ticketwaze/typescript-config";
import { getHtgExchangeRate } from "@/lib/getHtgExchangeRate";

export default async function Explore() {
  const htgExchangeRate = await getHtgExchangeRate();
  const [request, rafflesRequest, restaurantsRequest] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/events`, {
      next: { revalidate: 60 },
    }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/explore/raffles`, {
      next: { revalidate: 60 },
    }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/explore/restaurants`, {
      next: { revalidate: 60 },
    }),
  ]);
  const response = await request.json();
  const pastEvents: Event[] = response.pastEvents ?? [];
  // Teasers come back as their own array: they have no event_days, so the
  // upcoming/past queries both exclude them by construction. They are listed
  // alongside upcoming activities rather than in a section of their own, so
  // merge them here and re-sort — both queries order by created_at desc, and
  // concatenating alone would strand every teaser at the end of the list.
  const comingSoon: Event[] = response.comingSoon ?? [];
  const events: Event[] = [...response.events, ...comingSoon].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  let raffles: Raffle[] = [];
  try {
    const rafflesResponse = await rafflesRequest.json();
    raffles = rafflesResponse.raffles ?? [];
  } catch {
    raffles = [];
  }

  let restaurants: Restaurant[] = [];
  try {
    const restaurantsResponse = await restaurantsRequest.json();
    restaurants = restaurantsResponse.restaurants ?? [];
  } catch {
    restaurants = [];
  }

  return (
    <AttendeeLayout title="Explore" className="overflow-x-hidden">
      <ExplorePageContent
        events={events}
        pastEvents={pastEvents}
        raffles={raffles}
        restaurants={restaurants}
        wallet={null}
        htgExchangeRate={htgExchangeRate}
      />
    </AttendeeLayout>
  );
}
