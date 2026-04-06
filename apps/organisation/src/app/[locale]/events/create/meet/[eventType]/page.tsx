import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import CreateMeetEventForm from "./CreateMeetEventForm";
import { organisationPolicy } from "@/lib/role/organisationPolicy";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import { auth } from "@/lib/auth";

export default async function InPersonPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventType: string }>;
  searchParams: Promise<{ code: string | undefined }>;
}) {
  const { eventType } = await params;
  const { code } = await searchParams;
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
      <CreateMeetEventForm eventType={eventType} code={code} />
    </OrganizerLayout>
  );
}
