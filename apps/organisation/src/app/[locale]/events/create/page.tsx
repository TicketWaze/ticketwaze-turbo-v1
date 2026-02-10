import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale, getTranslations } from "next-intl/server";
import EventTypeList from "./EventTypeList";
import { auth } from "@/lib/auth";
import { MembershipTier, Organisation } from "@ticketwaze/typescript-config";
import { organisationPolicy } from "@/lib/role/organisationPolicy";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";

export default async function CreatePage() {
  const t = await getTranslations("Events.create_event");
  const locale = await getLocale();
  const session = await auth();
  const authorized = await organisationPolicy.createEvent(
    session?.user.userId ?? "",
    session?.activeOrganisation.organisationId ?? "",
  );
  if (!authorized) {
    return <UnauthorizedView />;
  }
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations/me/${session?.activeOrganisation.organisationId}`,
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
  const organisation: Organisation = response.organisation;
  const membershipTier: MembershipTier = response.membershipTier;
  return (
    <OrganizerLayout title={t("title")}>
      <EventTypeList
        organisation={organisation}
        membershipTier={membershipTier}
      />
    </OrganizerLayout>
  );
}
