import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import CreateOnlineEventForm from "./CreateOnlineEventForm";
import { organisationPolicy } from "@/lib/role/organisationPolicy";
import { auth } from "@/lib/auth";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";

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
      <CreateOnlineEventForm />
    </OrganizerLayout>
  );
}
