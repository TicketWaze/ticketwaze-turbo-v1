import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import {
  OrganisationMember,
  WaitlistMember,
} from "@ticketwaze/typescript-config";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import TeamContent from "./TeamContent";

export default async function Page() {
  const locale = await getLocale();
  const session = await auth();
  const organisationId = session?.activeOrganisation.organisationId;
  const headers = {
    "Content-Type": "application/json",
    "Accept-Language": locale,
    origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
    Authorization: `Bearer ${session?.user.accessToken}`,
  };
  const [teamRes, permissionsRes] = await Promise.all([
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/team`,
      { headers },
    ),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/organisations/permissions`, {
      headers,
    }),
  ]);
  if (teamRes.status === 403) return <UnauthorizedView />;
  const response = await teamRes.json().catch(() => null);
  if (!teamRes.ok || !response?.members) {
    return (
      <OrganizerLayout title="">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }
  const permissionsData = await permissionsRes.json().catch(() => null);
  return (
    <OrganizerLayout title="">
      <TeamContent
        members={response.members as OrganisationMember[]}
        invites={
          (response.waitlistMembers ?? []) as (WaitlistMember & {
            permissions?: string[];
          })[]
        }
        availablePermissions={(permissionsData?.permissions ?? []) as string[]}
        // Effective limit from the API (trials keep the free plan's team size).
        teamLimit={response.teamLimit as number | undefined}
      />
    </OrganizerLayout>
  );
}
