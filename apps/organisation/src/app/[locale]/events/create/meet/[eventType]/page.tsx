import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
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
  if (request.status === 403) {
    return <UnauthorizedView />;
  }
  const response = await request.json().catch(() => null);
  if (!request.ok || !response?.membershipTier) {
    return (
      <OrganizerLayout title="">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }
  const membershipTier = response.membershipTier;
  // Null on a free plan AND on a trial. The document rule needs the
  // trial-excluding signal, not `membershipTier`, which counts trials.
  const paidTierName = response.paidTierName ?? null;

  /**
   * The plan's seat cap and duration ceiling, so the ticket and date steps can
   * refuse an oversell or an over-long event where the organiser can still fix
   * it — rather than on submit, three steps later.
   *
   * BOTH providers have these limits. Zoom reports them from the account;
   * Google reports nothing at all, so its figures come from the plan the
   * organiser declared and are null until they have. Either way the shape is
   * the same, so one read serves both and the form does not care which platform
   * answered.
   */
  let seatLimit: number | null = null;
  let maxMeetingMinutes: number | null = null;
  try {
    const provider = onlineProvider === "zoom" ? "zoom" : "google";
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
    if (statusResponse.status === "success" && status?.seatLimit) {
      seatLimit = Number(status.seatLimit);
    }
    if (statusResponse.status === "success" && status?.maxDurationMinutes) {
      maxMeetingMinutes = Number(status.maxDurationMinutes);
    }
  } catch (error) {
    // Left null rather than guessed at. The API still refuses an oversell on
    // submit, so the cap holds either way; only the early warning is lost.
    console.error("Failed to read the online plan limits:", error);
  }

  return (
    <OrganizerLayout title="">
      <CreateMeetEventForm
        eventType={eventType}
        code={code}
        onlineProvider={onlineProvider}
        seatLimit={seatLimit}
        maxMeetingMinutes={maxMeetingMinutes}
        membershipTier={membershipTier}
        paidTierName={paidTierName}
      />
    </OrganizerLayout>
  );
}
