import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import EditInPersonEventForm from "./EditInPersonEventForm";
import { Event } from "@ticketwaze/typescript-config";
import { extractIdFromSlug } from "@/lib/Slugify";
import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";

export default async function EditEvent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const eventId = extractIdFromSlug(slug);
  const eventRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`,
  );
  const eventResponse = await eventRequest.json();
  const event: Event = eventResponse.event;
  const session = await auth();
  const locale = await getLocale();
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
    <OrganizerLayout title="Edit Event">
      <EditInPersonEventForm event={event} membershipTier={membershipTier} />
    </OrganizerLayout>
  );
}
