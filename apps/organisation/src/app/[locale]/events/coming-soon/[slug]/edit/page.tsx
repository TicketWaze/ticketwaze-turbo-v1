import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getTranslations } from "next-intl/server";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import CreateComingSoonForm from "../../../create/coming-soon/CreateComingSoonForm";
import { getTeaser } from "../getTeaser";

/**
 * Editing a teaser's few fields. Reached from the More menu on the teaser page,
 * which is where the equivalent link sits on a real event.
 */
export default async function EditComingSoonEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslations("Events.coming_soon");
  const { event, organisationId } = await getTeaser(slug);

  if (!event) {
    return (
      <OrganizerLayout title={t("edit_title")}>
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout title={t("edit_title")}>
      <CreateComingSoonForm organisationId={organisationId} event={event} />
    </OrganizerLayout>
  );
}
