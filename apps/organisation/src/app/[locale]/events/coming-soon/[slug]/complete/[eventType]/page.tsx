import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import CreateInPersonEventForm from "../../../../create/in-person/[eventType]/CreateInPersonEventForm";
import { OrganisationPolicy } from "@/lib/role/organisationPolicy";
import { auth } from "@/lib/auth";
import { getLocale, getTranslations } from "next-intl/server";
import { getTeaser } from "../../getTeaser";

/**
 * Publishing a teaser, using the very same wizard as creating an event from
 * scratch — a published teaser has to be indistinguishable from any other
 * event, and the surest way to get there is to run the same form.
 *
 * The teaser is handed to the wizard, which prefills what it already knows and
 * points submission at the publish endpoint instead of create.
 */
export default async function CompleteComingSoonEventPage({
  params,
}: {
  params: Promise<{ slug: string; eventType: string }>;
}) {
  const { slug, eventType } = await params;
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("Events.coming_soon");

  const authorized = OrganisationPolicy.fromSession(
    session?.activeOrganisation?.myPermissions ?? [],
  ).createEvent();
  if (!authorized) return <UnauthorizedView />;

  const { event } = await getTeaser(slug);
  if (!event) {
    return (
      <OrganizerLayout title={t("publish.title")}>
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations/me/${session?.activeOrganisation?.organisationId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
        "Accept-Language": locale,
        origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
      },
    },
  );
  const response = await request.json();
  const membershipTier = response.membershipTier;

  return (
    <OrganizerLayout title="">
      <CreateInPersonEventForm
        eventType={eventType}
        membershipTier={membershipTier}
        teaser={event}
      />
    </OrganizerLayout>
  );
}
