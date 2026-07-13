import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import AttendeesPageContent from "./AttendeesPageContent";
import { Event } from "@ticketwaze/typescript-config";
import { getTranslations, getLocale } from "next-intl/server";
import BackButton from "@/components/shared/BackButton";
import { auth } from "@/lib/auth";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import { extractIdFromSlug } from "@/lib/Slugify";

export default async function Attendees({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const eventId = extractIdFromSlug(slug);
  const t = await getTranslations("Events.single_event.attendees");
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
  if (!eventRequest.ok || !eventResponse?.event) {
    return (
      <OrganizerLayout title="">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }
  const event: Event = eventResponse.event;

  return (
    <OrganizerLayout title="">
      <BackButton text={t("back")} />
      <AttendeesPageContent event={event} />
    </OrganizerLayout>
  );
}
