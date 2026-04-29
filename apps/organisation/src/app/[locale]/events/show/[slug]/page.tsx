import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale, getTranslations } from "next-intl/server";
import EventPageDetails from "./components/EventPageDetails";
import { auth } from "@/lib/auth";
import { Event, EventPerformer, User } from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";
import { extractIdFromSlug } from "@/lib/Slugify";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const eventId = extractIdFromSlug(slug);
  const t = await getTranslations("Events.single_event");
  const locale = await getLocale();
  const eventRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`,
  );
  const eventResponse = await eventRequest.json();
  const event: Event = eventResponse.event;
  const tickets = eventResponse.tickets;
  const orders = eventResponse.orders;
  const eventPerformers: EventPerformer[] = event.eventPerformers;
  const session = await auth();

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
  const response = await request.json();
  const membershipTier = response.membershipTier;

  return (
    <OrganizerLayout title="">
      <BackButton text={t("back")} />
      <EventPageDetails
        user={session?.user as User}
        event={event}
        tickets={tickets}
        slug={slug}
        orders={orders}
        eventPerformers={eventPerformers}
        membershipTier={membershipTier}
      />
    </OrganizerLayout>
  );
}
