import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Event, MembershipTier } from "@ticketwaze/typescript-config";
import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import { OrganisationPolicy } from "@/lib/role/organisationPolicy";
import { auth } from "@/lib/auth";
import { extractIdFromSlug } from "@/lib/Slugify";
import { isEventPast } from "@/lib/eventTime";
import CreateTicketForm from "./CreateTicketForm";

/**
 * Create Ticket for an existing event (Figma 1785:39235). Only reachable
 * while the event header offers it — in-person, not over, not being deleted,
 * on a plan with custom ticket classes; anything else goes back to the event.
 */
export default async function CreateTicketPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const locale = await getLocale();
  if (
    !OrganisationPolicy.fromSession(
      session?.activeOrganisation?.myPermissions ?? [],
    ).editEvent()
  ) {
    return <UnauthorizedView />;
  }

  const organisationId = session?.activeOrganisation?.organisationId;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.user.accessToken}`,
    "Accept-Language": locale,
    origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
  };
  const [eventRequest, orgRequest] = await Promise.all([
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/events/${extractIdFromSlug(slug)}`,
      { headers },
    ),
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/me/${organisationId}`,
      {
        headers,
      },
    ),
  ]);
  if (eventRequest.status === 403) return <UnauthorizedView />;
  const eventResponse = await eventRequest.json().catch(() => null);
  const orgResponse = await orgRequest.json().catch(() => null);
  if (!eventResponse?.event || !orgResponse?.membershipTier) {
    return (
      <OrganizerLayout title="">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }
  const event: Event = eventResponse.event;
  const membershipTier: MembershipTier = orgResponse.membershipTier;

  if (
    event.eventCategory !== "physical" ||
    event.deletionStatus ||
    isEventPast(event.eventDays) ||
    !membershipTier.customTicketTypes
  ) {
    redirect(`/${locale}/events/show/${slug}`);
  }

  return (
    <OrganizerLayout
      title=""
      className="h-full w-full flex flex-col overflow-hidden"
    >
      <CreateTicketForm event={event} membershipTier={membershipTier} />
    </OrganizerLayout>
  );
}
