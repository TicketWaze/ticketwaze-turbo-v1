import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import SeasonForm from "@/components/season/SeasonForm";
import { OrganisationPolicy } from "@/lib/role/organisationPolicy";
import { auth } from "@/lib/auth";

/** CREATE A SEASON. Same permission as creating an event: its matches are events. */
export default async function CreateSeasonPage() {
  const session = await auth();
  const authorized = OrganisationPolicy.fromSession(
    session?.activeOrganisation?.myPermissions ?? [],
  ).createEvent();
  if (!authorized) return <UnauthorizedView />;
  return (
    <OrganizerLayout title="">
      <SeasonForm />
    </OrganizerLayout>
  );
}
