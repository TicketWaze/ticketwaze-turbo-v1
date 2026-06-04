import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import { auth } from "@/lib/auth";
import { getLocale, getTranslations } from "next-intl/server";
import SubscriptionUpgradePageContent from "./SubscriptionUpgradePageContent";
import { MembershipTier, OrganisationSubscription } from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";

export default async function SubscriptionUpgradePage() {
  const t = await getTranslations("Settings.subscriptions");
  const locale = await getLocale();
  const session = await auth();

  const [subRequest, tiersRequest] = await Promise.all([
    fetch(
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
    ),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/memberships`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": locale,
      },
    }),
  ]);
  if (subRequest.status === 403) {
    return <UnauthorizedView />;
  }

  const subResponse = await subRequest.json();
  const tiersResponse = await tiersRequest.json();
  const membershipTier: MembershipTier = subResponse.membershipTier;
  const membershipTiers: MembershipTier[] = tiersResponse.memberships ?? [];
  const organisationSubscriptions: OrganisationSubscription[] =
    subResponse.organisationSubscriptions ?? [];

  return (
    <OrganizerLayout title="" className="">
      <BackButton text={t("back")} />
      {/* <TopBar title={t("upgrade")} /> */}
      <SubscriptionUpgradePageContent
        membershipTier={membershipTier}
        membershipTiers={membershipTiers}
        organisationSubscriptions={organisationSubscriptions}
      />
    </OrganizerLayout>
  );
}
