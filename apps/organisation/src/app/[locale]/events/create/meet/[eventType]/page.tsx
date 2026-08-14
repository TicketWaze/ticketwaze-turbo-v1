import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import CreateMeetEventForm from "./CreateMeetEventForm";
import { OrganisationPolicy } from "@/lib/role/organisationPolicy";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";

export default async function InPersonPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventType: string }>;
  searchParams: Promise<{
    code: string | undefined;
    provider: string | undefined;
  }>;
}) {
  const { eventType } = await params;
  const { code, provider } = await searchParams;
  // Chosen two steps back and only carried here. Anything but Zoom means
  // Google Meet, which is what an online event meant before Zoom existed.
  const onlineProvider = provider === "zoom" ? "zoom" : "google_meet";
  const session = await auth();
  const locale = await getLocale();
  // Authorize against the member's effective permissions (role default OR
  // custom grant), matching the API and the rest of the dashboard.
  const authorized = OrganisationPolicy.fromSession(
    session?.activeOrganisation?.myPermissions ?? [],
  ).createEvent();
  if (!authorized) {
    return <UnauthorizedView />;
  }
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

  /**
   * The Zoom seat cap, so the ticket step can refuse an oversell where the
   * organiser can still fix it — rather than on submit, three steps later.
   * Null on Google Meet, which has no equivalent limit.
   */
  let zoomSeatLimit: number | null = null;
  let zoomMaxMeetingMinutes: number | null = null;
  if (onlineProvider === "zoom") {
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
      if (zoomResponse.status === "success" && zoomResponse.zoom?.seatLimit) {
        zoomSeatLimit = Number(zoomResponse.zoom.seatLimit);
      }
      if (
        zoomResponse.status === "success" &&
        zoomResponse.zoom?.maxDurationMinutes
      ) {
        zoomMaxMeetingMinutes = Number(zoomResponse.zoom.maxDurationMinutes);
      }
    } catch (error) {
      // Left null rather than guessed at. The API still refuses an oversell on
      // submit, so the cap holds either way; only the early warning is lost.
      console.error("Failed to read the Zoom seat limit:", error);
    }
  }

  return (
    <OrganizerLayout title="">
      <CreateMeetEventForm
        eventType={eventType}
        code={code}
        onlineProvider={onlineProvider}
        zoomSeatLimit={zoomSeatLimit}
        zoomMaxMeetingMinutes={zoomMaxMeetingMinutes}
        membershipTier={membershipTier}
      />
    </OrganizerLayout>
  );
}
