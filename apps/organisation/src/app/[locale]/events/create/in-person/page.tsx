import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import BackButton from "@/components/shared/BackButton";
import TopBar from "@/components/shared/TopBar";
import EventCategoryPicker from "@/components/shared/EventCategoryPicker";
import { auth } from "@/lib/auth";
import { OrganisationPolicy } from "@/lib/role/organisationPolicy";
import { getTranslations } from "next-intl/server";

export default async function InPersonEventTypePage() {
  const session = await auth();
  // Authorize against the member's effective permissions (role default OR the
  // custom permissions granted to them), matching the API and the rest of the
  // dashboard. The old role-only check ignored custom grants and wrongly locked
  // out members who were given event access on top of a base Staff role.
  const authorized = OrganisationPolicy.fromSession(
    session?.activeOrganisation?.myPermissions ?? [],
  ).createEvent();
  if (!authorized) return <UnauthorizedView />;
  const t = await getTranslations("Events.create_event.list.inPerson");
  return (
    <OrganizerLayout title="InPersonEventTypePage">
      <div className="flex flex-col gap-8">
        <BackButton text={t("back")} />
        <TopBar title={t("title")} />
      </div>
      <EventCategoryPicker hrefPrefix="/events/create/in-person" />
    </OrganizerLayout>
  );
}
