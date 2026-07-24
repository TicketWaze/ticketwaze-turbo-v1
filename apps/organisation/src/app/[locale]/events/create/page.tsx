import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale, getTranslations } from "next-intl/server";
import EventTypeList from "./EventTypeList";
import { auth } from "@/lib/auth";
import { MembershipTier, Organisation } from "@ticketwaze/typescript-config";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";

export default async function CreatePage() {
  const t = await getTranslations("Events.create_event");
  const locale = await getLocale();
  const session = await auth();
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
  if (request.status === 403) {
    return <UnauthorizedView />;
  }
  const response = await request.json().catch(() => null);
  if (!request.ok || !response?.organisation) {
    return (
      <OrganizerLayout title={t("title")}>
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }
  const organisation: Organisation = response.organisation;
  const membershipTier: MembershipTier = response.membershipTier;
  // Trial-excluding plan name. Restaurants require a paid plan, so they cannot
  // be gated on membershipTier, which counts trials as the tier they trial.
  const paidTierName: string = response.paidTierName ?? "free";
  return (
    <OrganizerLayout title={t("title")}>
      <EventTypeList
        organisation={organisation}
        membershipTier={membershipTier}
        paidTierName={paidTierName}
      />
    </OrganizerLayout>
  );
}
