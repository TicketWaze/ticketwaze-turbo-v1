import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import CreatePrivateEventForm from "./CreatePrivateEventForm";
import { auth } from "@/lib/auth";
import { organisationPolicy } from "@/lib/role/organisationPolicy";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";

export default async function PrivatePage() {
  const session = await auth();
  const authorized = await organisationPolicy.createEvent(
    session?.user.userId ?? "",
    session?.activeOrganisation.organisationId ?? "",
  );
  if (!authorized) {
    return <UnauthorizedView />;
  }
  return (
    <OrganizerLayout title="Private event">
      <CreatePrivateEventForm />
    </OrganizerLayout>
  );
}
