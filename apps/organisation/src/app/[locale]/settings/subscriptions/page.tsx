import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";
import SubscriptionPageContent from "./SubscriptionPageContent";
import {
  OrganisationSubscription,
  MembershipTier,
} from "@ticketwaze/typescript-config";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";

export default async function SubscriptionPage() {
  const locale = await getLocale();
  const session = await auth();
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations/${session?.activeOrganisation.organisationId}/subscriptions`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
        origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        "Accept-Language": locale,
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
  const organisationSubscriptions: OrganisationSubscription[] =
    response.organisationSubscriptions;
  const membershipTier: MembershipTier = response.membershipTier;
  return (
    <OrganizerLayout title="">
      <SubscriptionPageContent
        organisationSubscriptions={organisationSubscriptions}
        membershipTier={membershipTier}
      />
    </OrganizerLayout>
  );
}
