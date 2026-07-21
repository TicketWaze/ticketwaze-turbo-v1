import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getTranslations } from "next-intl/server";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import BackButton from "@/components/shared/BackButton";
import ComingSoonPageDetails from "./components/ComingSoonPageDetails";
import { getTeaser } from "./getTeaser";

/**
 * A teaser's management page.
 *
 * Structured like `/events/show/[slug]` on purpose — same top bar, stat grid
 * and overflow menu — because to an organiser this is the same kind of screen.
 * Editing lives behind the More menu rather than being the page itself, and
 * publishing is the primary action at the top.
 */
export default async function ComingSoonEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslations("Events.coming_soon");
  const { event, reservations } = await getTeaser(slug, {
    withReservations: true,
  });

  if (!event) {
    return (
      <OrganizerLayout title={t("title")}>
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout title="">
      <BackButton text={t("back")} />
      <ComingSoonPageDetails
        event={event}
        slug={slug}
        reservations={reservations}
      />
    </OrganizerLayout>
  );
}
