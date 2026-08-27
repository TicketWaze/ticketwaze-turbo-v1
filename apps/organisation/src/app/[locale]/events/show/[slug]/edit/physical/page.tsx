import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import EditInPersonEventForm from "./EditInPersonEventForm";
import { Event } from "@ticketwaze/typescript-config";
import { extractIdFromSlug } from "@/lib/Slugify";
import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";
import { OrganisationPolicy } from "@/lib/role/organisationPolicy";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import { redirect } from "next/navigation";

export default async function EditEvent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const eventId = extractIdFromSlug(slug);
  const session = await auth();
  const locale = await getLocale();
  // Authorize against the member's effective permissions (role default OR the
  // custom permissions granted to them), matching the API and the rest of the
  // dashboard. The old role-only check ignored custom grants.
  const authorized = OrganisationPolicy.fromSession(
    session?.activeOrganisation?.myPermissions ?? [],
  ).editEvent();
  if (!authorized) return <UnauthorizedView />;
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
  // `event.deletionStatus` is read on the next line, so a missing `event` key
  // was not a degraded page but a thrown TypeError during the server render.
  if (!eventRequest.ok || !eventResponse?.event) {
    return (
      <OrganizerLayout title="Edit Event">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }
  const event: Event = eventResponse.event;
  if (event.deletionStatus != null) redirect(`/events/show/${slug}`);
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
  if (!request.ok || !response?.membershipTier) {
    return (
      <OrganizerLayout title="Edit Event">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }
  const membershipTier = response.membershipTier;
  return (
    <OrganizerLayout title="Edit Event">
      <EditInPersonEventForm event={event} membershipTier={membershipTier} />
    </OrganizerLayout>
  );
}
