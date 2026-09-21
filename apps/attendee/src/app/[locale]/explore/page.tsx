import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import ExplorePageContent from "./ExplorePageContent";
import { getActivityCardTime } from "@/lib/activityCardDate";
import {
  Event,
  PublicSale,
  Raffle,
  Restaurant,
} from "@ticketwaze/typescript-config";

export default async function Explore({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  // Onboarding hands off with `?welcome=1`: the modal is then server-rendered
  // open, so it is on screen the moment /explore paints instead of after a
  // client round trip the user could outrun on a slow connection.
  const { welcome } = await searchParams;
  const [request, rafflesRequest, restaurantsRequest, salesRequest] =
    await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/events`, {
        next: { revalidate: 60 },
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/explore/raffles`, {
        next: { revalidate: 60 },
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/explore/restaurants`, {
        next: { revalidate: 60 },
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/explore/sales`, {
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
  //
  // The re-sort is CHRONOLOGICAL, not newest-first: the feed reads 21 Sept, 22,
  // 23 straight down, whatever type each activity is and whenever it was
  // published. Sorting by created_at put a teaser announced this morning above
  // an event happening tonight, so the dates printed on the cards ran in no
  // order a reader could follow. The key is the day each card actually shows,
  // so the list agrees with what is written on it — see getActivityCardTime.
  const comingSoon: Event[] = response.comingSoon ?? [];
  const now = new Date();
  const events: Event[] = [...response.events, ...comingSoon].sort(
    (a, b) => getActivityCardTime(a, now) - getActivityCardTime(b, now),
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

  // Same guard as the two above: the API omits its data key on error, and one
  // failing section must not take the whole explore page down with it.
  let sales: PublicSale[] = [];
  try {
    const salesResponse = await salesRequest.json();
    sales = salesResponse.sales ?? [];
  } catch {
    sales = [];
  }

  return (
    <AttendeeLayout
      title="Explore"
      className="overflow-x-hidden"
      forceWelcomeModal={welcome === "1"}
    >
      <ExplorePageContent
        events={events}
        pastEvents={pastEvents}
        raffles={raffles}
        restaurants={restaurants}
        sales={sales}
        wallet={null}
      />
    </AttendeeLayout>
  );
}
