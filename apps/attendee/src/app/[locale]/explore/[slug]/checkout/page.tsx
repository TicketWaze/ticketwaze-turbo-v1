import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";
import CheckoutFlow from "./CheckoutFlow";
import { redirect } from "@/i18n/navigation";
import { Event, EventTicketType, User } from "@ticketwaze/typescript-config";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const eventRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/events/${slug}`,
  );
  const eventResponse = await eventRequest.json();
  const event: Event = eventResponse.event;
  const ticketTypes: EventTicketType[] = eventResponse.ticketTypes;
  const locale = await getLocale();
  if (!session) {
    redirect({ href: "/auth/login", locale });
  }

  return (
    <AttendeeLayout title="Buy Tickets">
      <CheckoutFlow
        event={event}
        ticketTypes={ticketTypes}
        user={session?.user as User}
      />
    </AttendeeLayout>
  );
}
