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
  // Null on a free plan AND on a trial — the trial-excluding signal the
  // document rule needs, unlike `membershipTier`, which counts trials.
  const paidTierName = response.paidTierName ?? null;

  /**
   * The plan's meeting duration limit, on whichever platform hosts this event.
   *
   * Read here rather than stored on the event: unlike the seat cap, which is
   * frozen at creation because tickets are already sold against it, the
   * duration ceiling is whatever the plan allows right now — the platform will
   * cut the call at today's limit regardless of what was true when the event
   * was made.
   *
   * The seat figure alongside it is the FALLBACK for Google Meet events created
   * before the plan was declared, and is ignored where the event carries its
   * own.
   */
  let maxMeetingMinutes: number | null = null;
  let googleSeatLimit: number | null = null;
  try {
    const provider = event.onlineProvider === "zoom" ? "zoom" : "google";
    const statusRequest = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${provider}/${session?.activeOrganisation?.organisationId}/status`,
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
    const statusResponse = await statusRequest.json();
    const status =
      provider === "zoom" ? statusResponse.zoom : statusResponse.google;
    if (statusResponse.status === "success" && status?.maxDurationMinutes) {
      maxMeetingMinutes = Number(status.maxDurationMinutes);
    }
    if (
      provider === "google" &&
      statusResponse.status === "success" &&
      status?.seatLimit
    ) {
      googleSeatLimit = Number(status.seatLimit);
    }
  } catch (error) {
    // Left null. The API still refuses an over-long edit on submit, so the
    // limit holds either way; only the early warning is lost.
    console.error("Failed to read the meeting duration limit:", error);
  }

  return (
    <OrganizerLayout title="Edit Event">
      <EditInPersonEventForm
        event={event}
        membershipTier={membershipTier}
        maxMeetingMinutes={maxMeetingMinutes}
        googleSeatLimit={googleSeatLimit}
        paidTierName={paidTierName}
      />
    </OrganizerLayout>
  );
}
