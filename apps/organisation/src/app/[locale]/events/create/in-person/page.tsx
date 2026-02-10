import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import CreateInPersonEventForm from "./CreateInPersonEventForm";
import { organisationPolicy } from "@/lib/role/organisationPolicy";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import { auth } from "@/lib/auth";

export default async function InPersonPage() {
  const session = await auth();
  const authorized = await organisationPolicy.createEvent(
    session?.user.userId ?? "",
    session?.activeOrganisation.organisationId ?? "",
  );
  if (!authorized) {
    return <UnauthorizedView />;
  }
  return (
    <OrganizerLayout title="">
      <CreateInPersonEventForm />
    </OrganizerLayout>
  );
}
