import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import TopBar from "@/components/shared/TopBar";
import { auth } from "@/lib/auth";
import { organisationPolicy } from "@/lib/role/organisationPolicy";
import { getLocale, getTranslations } from "next-intl/server";
import SubscriptionUpgradePageContent from "./SubscriptionUpgradePageContent";
import { MembershipTier } from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";

export default async function SubscriptionUpgradePage() {
  const t = await getTranslations("Settings.subscriptions");
  const locale = await getLocale();
  const session = await auth();
  const authorized = await organisationPolicy.viewFinance(
    session?.user.userId ?? "",
    session?.activeOrganisation.organisationId ?? "",
  );
  if (!authorized) {
    return <UnauthorizedView />;
  }
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
  const response = await request.json();
  const membershipTier: MembershipTier = response.membershipTier;
  return (
    <OrganizerLayout title="" className="">
      <BackButton text={t("back")} />
      <TopBar title={t("upgrade")} />
      <SubscriptionUpgradePageContent membershipTier={membershipTier} />
      <div></div>
    </OrganizerLayout>
  );
}
