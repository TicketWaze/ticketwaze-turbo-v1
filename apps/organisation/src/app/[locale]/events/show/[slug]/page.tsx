import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale, getTranslations } from "next-intl/server";
import EventPageDetails from "./components/EventPageDetails";
import { auth } from "@/lib/auth";
import {
  Event,
  EventPerformer,
  TicketReturn,
} from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";
import { extractIdFromSlug } from "@/lib/Slugify";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const eventId = extractIdFromSlug(slug);
  const t = await getTranslations("Events.single_event");
  const locale = await getLocale();
  const session = await auth();
  const eventRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations/${session?.activeOrganisation.organisationId}/events/${eventId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
        "Accept-Language": locale,
        origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
      },
    },
  );
  if (eventRequest.status === 403) {
    return <UnauthorizedView />;
  }
  const eventResponse = await eventRequest.json().catch(() => null);
  // A 403 is answered above. Everything else — an expired session, a 404, a
  // non-JSON body from a proxy — used to arrive here as a missing `event` key
  // and throw on the first property read.
  if (!eventRequest.ok || !eventResponse?.event) {
    return (
      <OrganizerLayout title="">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }
  const event: Event = eventResponse.event;
  const tickets = event.tickets;
  const orders = event.orders;
  const eventPerformers: EventPerformer[] = event.eventPerformers;
  const ticketReturns: TicketReturn[] = eventResponse.ticketReturns ?? [];

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations/me/${session?.activeOrganisation?.organisationId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
        "Accept-Language": locale,
        origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
      },
    },
  );
  const response = await request.json().catch(() => null);
  // Without this the page rendered with membershipTier undefined, which reads
  // as "no plan" to every gate downstream — silently, with nothing shown.
  if (!request.ok || !response?.membershipTier) {
    return (
      <OrganizerLayout title="">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }
  const membershipTier = response.membershipTier;

  return (
    <OrganizerLayout title="">
      <BackButton text={t("back")} />
      <EventPageDetails
        event={event}
        tickets={tickets}
        slug={slug}
        orders={orders}
        eventPerformers={eventPerformers}
        membershipTier={membershipTier}
        ticketReturns={ticketReturns}
      />
    </OrganizerLayout>
  );
}
