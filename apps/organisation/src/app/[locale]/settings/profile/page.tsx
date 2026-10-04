import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { MembershipTier, Organisation } from "@ticketwaze/typescript-config";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import ProfileContent from "./ProfileContent";

export default async function ProfilePage() {
  const locale = await getLocale();
  const session = await auth();
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations/me/${session?.activeOrganisation.organisationId}`,
    {
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": locale,
        origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    },
  );
  if (request.status === 403) return <UnauthorizedView />;
  const response = await request.json().catch(() => null);
  if (!request.ok || !response?.organisation) {
    return (
      <OrganizerLayout title="">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }
  return (
    <OrganizerLayout title="">
      <ProfileContent
        organisation={response.organisation as Organisation}
        membershipTier={response.membershipTier as MembershipTier}
      />
    </OrganizerLayout>
  );
}
