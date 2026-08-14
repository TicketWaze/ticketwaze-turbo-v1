import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import EditInPersonEventForm from "./EditMeetEventForm";
import { Event } from "@ticketwaze/typescript-config";
import { extractIdFromSlug } from "@/lib/Slugify";
import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";
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

  /**
   * The Zoom plan's meeting duration limit.
   *
   * Read here rather than stored on the event: unlike the seat cap, which is
   * frozen at creation because tickets are already sold against it, the
   * duration ceiling is whatever the plan allows right now. Null on Google
   * Meet, which has no such limit.
   */
  let zoomMaxMeetingMinutes: number | null = null;
  if (event.onlineProvider === "zoom") {
    try {
      const zoomRequest = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/zoom/${session?.activeOrganisation?.organisationId}/status`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user.accessToken}`,
            "Accept-Language": locale,
            origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
          },
          cache: "no-store",
        },
      );
      const zoomResponse = await zoomRequest.json();
      if (
        zoomResponse.status === "success" &&
        zoomResponse.zoom?.maxDurationMinutes
      ) {
        zoomMaxMeetingMinutes = Number(zoomResponse.zoom.maxDurationMinutes);
      }
    } catch (error) {
      // Left null. The API still refuses an over-long edit on submit, so the
      // limit holds either way; only the early warning is lost.
      console.error("Failed to read the Zoom meeting duration limit:", error);
    }
  }

  return (
    <OrganizerLayout title="Edit Event">
      <EditInPersonEventForm
        event={event}
        membershipTier={membershipTier}
        zoomMaxMeetingMinutes={zoomMaxMeetingMinutes}
      />
    </OrganizerLayout>
  );
}
