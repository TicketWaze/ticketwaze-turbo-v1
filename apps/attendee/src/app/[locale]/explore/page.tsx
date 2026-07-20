import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import ExplorePageContent from "./ExplorePageContent";
import { Event, Raffle, Restaurant } from "@ticketwaze/typescript-config";

export default async function Explore() {
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
  const events: Event[] = response.events;
  const pastEvents: Event[] = response.pastEvents ?? [];

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
      />
    </AttendeeLayout>
  );
}
