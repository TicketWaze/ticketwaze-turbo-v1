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

export default async function Page() {
  const t = await getTranslations("Settings.team");
  const locale = await getLocale();
  const session = await auth();
  const organisationId = session?.activeOrganisation.organisationId;
  const request = await fetch(
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
  );
  const response = await request.json();
  const members: OrganisationMember[] = response.members;
  const waitlistMembers: WaitlistMember[] = response.waitlistMembers;
  return (
    <OrganizerLayout title={t("title")}>
      <div className="flex flex-col gap-8">
        <BackButton text={t("back")} />
        <TopBar title={t("title")}>
          <AddMember />
        </TopBar>
      </div>
      <MemberList members={members} waitlistMembers={waitlistMembers} />
    </OrganizerLayout>
  );
}
