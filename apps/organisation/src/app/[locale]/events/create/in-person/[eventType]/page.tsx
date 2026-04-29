import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import CreateInPersonEventForm from "./CreateInPersonEventForm";
import { organisationPolicy } from "@/lib/role/organisationPolicy";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
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
  const authorized = await organisationPolicy.createEvent(
    session?.user.userId ?? "",
    session?.activeOrganisation.organisationId ?? "",
  );
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
  return (
    <OrganizerLayout title="">
      <CreateInPersonEventForm
        eventType={eventType}
        membershipTier={membershipTier}
      />
    </OrganizerLayout>
  );
}
