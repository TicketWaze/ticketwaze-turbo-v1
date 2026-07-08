import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getTranslations, getLocale } from "next-intl/server";
import AddMember from "./AddMember";
import { auth } from "@/lib/auth";
import MemberList from "./MemberList";
import {
  OrganisationMember,
  WaitlistMember,
} from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";
import TopBar from "@/components/shared/TopBar";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";

export default async function Page() {
  const t = await getTranslations("Settings.team");
  const locale = await getLocale();
  const session = await auth();
  const organisationId = session?.activeOrganisation.organisationId;
  const [teamRes, permissionsRes] = await Promise.all([
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/team`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
          Authorization: `Bearer ${session?.user.accessToken}`,
        },
      },
    ),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/organisations/permissions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": locale,
        origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    }),
  ]);

  const response = await teamRes.json();
  if (teamRes.status === 403) {
    return <UnauthorizedView />;
  }
  const permissionsData = await permissionsRes.json();

  const members: OrganisationMember[] = response.members;
  const waitlistMembers: WaitlistMember[] = response.waitlistMembers;
  const availablePermissions: string[] = permissionsData?.permissions ?? [];
  const totalMembers = members.length + waitlistMembers.length;
  // Effective limit from the API: orgs on a free trial keep the free plan's
  // team size (3) — the tier on the session says "pro" during a trial.
  const teamLimit: number | undefined = response.teamLimit;

  return (
    <OrganizerLayout title={t("title")}>
      <div className="flex flex-col gap-8">
        <BackButton text={t("back")} />
        <TopBar title={t("title")}>
          <AddMember
            totalMembers={totalMembers}
            teamLimit={teamLimit}
            availablePermissions={availablePermissions}
          />
        </TopBar>
      </div>
      <MemberList
        members={members}
        waitlistMembers={waitlistMembers}
        availablePermissions={availablePermissions}
      />
    </OrganizerLayout>
  );
}
