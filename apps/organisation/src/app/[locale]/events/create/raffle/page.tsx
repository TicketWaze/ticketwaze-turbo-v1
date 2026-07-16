import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import CreateRaffleForm from "./CreateRaffleForm";
import { OrganisationPolicy } from "@/lib/role/organisationPolicy";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import { auth } from "@/lib/auth";

export default async function RafflePage() {
  const session = await auth();
  // Authorize against the member's effective permissions (role default OR
  // custom grant), matching the API and the rest of the dashboard.
  const authorized = OrganisationPolicy.fromSession(
    session?.activeOrganisation?.myPermissions ?? [],
  ).createEvent();
  if (!authorized) {
    return <UnauthorizedView />;
  }
  return (
    <OrganizerLayout title="">
      <CreateRaffleForm />
    </OrganizerLayout>
  );
}
