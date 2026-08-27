import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import CreateInPersonEventForm from "./CreateInPersonEventForm";
import { OrganisationPolicy } from "@/lib/role/organisationPolicy";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";

export default async function InPersonPage({
  params,
}: {
  params: Promise<{ eventType: string }>;
}) {
  const { eventType } = await params;
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
  // This is the read that made the reported 401 invisible: the fetch failed,
  // membershipTier came back undefined, and the create form rendered anyway
  // with its plan gates resolved against nothing.
  if (!request.ok || !response?.membershipTier) {
    return (
      <OrganizerLayout title="">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }
  const membershipTier = response.membershipTier;
  return (
    <OrganizerLayout title="">
      <CreateInPersonEventForm
        eventType={eventType}
        membershipTier={membershipTier}
      />
    </OrganizerLayout>
  );
}
