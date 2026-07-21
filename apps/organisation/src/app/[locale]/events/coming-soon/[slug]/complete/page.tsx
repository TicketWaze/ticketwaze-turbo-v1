import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import BackButton from "@/components/shared/BackButton";
import TopBar from "@/components/shared/TopBar";
import EventCategoryPicker from "@/components/shared/EventCategoryPicker";
import { auth } from "@/lib/auth";
import { OrganisationPolicy } from "@/lib/role/organisationPolicy";
import { getTranslations } from "next-intl/server";
import { getTeaser } from "../getTeaser";

/**
 * Step one of publishing a teaser: which kind of event did it turn out to be?
 *
 * A teaser is created without a category — not knowing yet is the whole point —
 * so this asks the same question the normal create flow asks, using the same
 * picker, before handing over to the same wizard.
 */
export default async function CompleteComingSoonCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const authorized = OrganisationPolicy.fromSession(
    session?.activeOrganisation?.myPermissions ?? [],
  ).createEvent();
  if (!authorized) return <UnauthorizedView />;

  const t = await getTranslations("Events.coming_soon");
  const { event } = await getTeaser(slug);

  if (!event) {
    return (
      <OrganizerLayout title={t("publish.title")}>
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout title="">
      <div className="flex flex-col gap-8">
        <BackButton text={t("back")} />
        <TopBar title={t("publish.category_title")} />
        <p className="text-[1.4rem] leading-7 text-neutral-600">
          {t("publish.category_hint")}
        </p>
      </div>
      <EventCategoryPicker hrefPrefix={`/events/coming-soon/${slug}/complete`} />
    </OrganizerLayout>
  );
}
