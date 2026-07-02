import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import ExplorePageContent from "./ExplorePageContent";
import { Event } from "@ticketwaze/typescript-config";

export default async function Explore() {
  const request = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events`, {
    next: { revalidate: 60 },
  });
  const response = await request.json();
  const events: Event[] = response.events;
  const pastEvents: Event[] = response.pastEvents ?? [];

  return (
    <AttendeeLayout title="Explore" className="overflow-x-hidden">
      <ExplorePageContent events={events} pastEvents={pastEvents} wallet={null} />
    </AttendeeLayout>
  );
}
