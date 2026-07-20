import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import CreateComingSoonForm from "./CreateComingSoonForm";

/**
 * The teaser create form.
 *
 * Deliberately the shortest create flow in the dashboard: an organiser reaching
 * for "coming soon" does so precisely because they do not have dates, a venue
 * or prices yet. Asking for any of them would defeat the point.
 */
export default async function CreateComingSoonPage() {
  const t = await getTranslations("Events.coming_soon");
  const session = await auth();

  return (
    <OrganizerLayout title={t("title")}>
      <CreateComingSoonForm
        organisationId={session?.activeOrganisation.organisationId ?? ""}
      />
    </OrganizerLayout>
  );
}
