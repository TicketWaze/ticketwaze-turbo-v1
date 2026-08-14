import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import CreateSaleForm from "./CreateSaleForm";
import { OrganisationPolicy } from "@/lib/role/organisationPolicy";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import { auth } from "@/lib/auth";

export default async function SalePage() {
  const session = await auth();
  // Authorize against the member's effective permissions (role default OR
  // custom grant), matching the API and the rest of the dashboard.
  const authorized = OrganisationPolicy.fromSession(
    session?.activeOrganisation?.myPermissions ?? [],
  ).createSale();
  if (!authorized) {
    return <UnauthorizedView />;
  }
  return (
    <OrganizerLayout title="">
      <CreateSaleForm />
    </OrganizerLayout>
  );
}
