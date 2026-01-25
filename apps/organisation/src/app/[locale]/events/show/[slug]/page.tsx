import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getTranslations } from "next-intl/server";
import EventPageDetails from "./components/EventPageDetails";
import { auth } from "@/lib/auth";
import { organisationPolicy } from "@/lib/role/organisationPolicy";
import { Event, EventPerformer, User } from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslations("Events.single_event");
  const eventRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/events/${slug}`,
  );
  const eventResponse = await eventRequest.json();
  const event: Event = eventResponse.event;
  const tickets = eventResponse.tickets;
  const orders = eventResponse.orders;
  const eventPerformers: EventPerformer[] = event.eventPerformers;

  const organisationCheckers = eventResponse.organisationCheckers;
  const session = await auth();
  const eventCheckers = eventResponse.eventCheckers;

  const authorized = await organisationPolicy.viewFinance(
    session?.user.userId ?? "",
    session?.activeOrganisation.organisationId ?? "",
  );

  return (
    <OrganizerLayout title="">
      <BackButton text={t("back")} />
      <EventPageDetails
        eventCheckers={eventCheckers}
        user={session?.user as User}
        event={event}
        tickets={tickets}
        slug={slug}
        organisationCheckers={organisationCheckers}
        orders={orders}
        authorized={authorized}
        eventPerformers={eventPerformers}
      />
    </OrganizerLayout>
  );
}
