import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { auth } from "@/lib/auth";
import CheckoutFlow from "./CheckoutFlow";
import { Event, EventTicketType, User } from "@ticketwaze/typescript-config";
import { extractIdFromSlug } from "@/lib/Slugify";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const eventId = extractIdFromSlug(slug);
  const session = await auth();
  const eventRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`,
  );
  const eventResponse = await eventRequest.json();
  const event: Event = eventResponse.event;
  const ticketTypes: EventTicketType[] = eventResponse.ticketTypes;
  return (
    <AttendeeLayout title="Buy Tickets">
      <CheckoutFlow
        event={event}
        ticketTypes={ticketTypes}
        user={session?.user as User | undefined}
      />
    </AttendeeLayout>
  );
}
