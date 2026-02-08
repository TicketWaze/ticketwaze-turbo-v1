import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import TopBar from "@/components/shared/TopBar";
import { auth } from "@/lib/auth";
import { organisationPolicy } from "@/lib/role/organisationPolicy";
import { getLocale, getTranslations } from "next-intl/server";
import SubscriptionPageContent from "./SubscriptionPageContent";
import {
  OrganisationSubscription,
  MembershipTier,
} from "@ticketwaze/typescript-config";
import { LinkPrimary } from "@/components/shared/Links";
import { Crown } from "iconsax-reactjs";

export default async function SubscriptionPage() {
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
  const organisationSubscriptions: OrganisationSubscription[] =
    response.organisationSubscriptions;
  const membershipTier: MembershipTier = response.membershipTier;
  return (
    <OrganizerLayout title="">
      <TopBar title={t("title")}>
        <div className="flex-1 hidden lg:block p-[2px] rounded-[30px] bg-gradient-to-r from-primary-500 via-[#E752AE] to-[#DD068B]">
          <LinkPrimary
            className="bg-transparent gap-4 items-center"
            href="/settings/subscriptions/upgrade"
          >
            <Crown size="24" color="#fff" variant="Bulk" />
            {t("upgrade")}
          </LinkPrimary>
        </div>
      </TopBar>
      <SubscriptionPageContent
        organisationSubscriptions={organisationSubscriptions}
        membershipTier={membershipTier}
      />
    </OrganizerLayout>
  );
}
