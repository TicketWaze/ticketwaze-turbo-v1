import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Event } from "@ticketwaze/typescript-config";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import { extractIdFromSlug } from "@/lib/Slugify";
import CreateComingSoonForm from "../../create/coming-soon/CreateComingSoonForm";

/**
 * A teaser's management page.
 *
 * Separate from `/events/show/[slug]` on purpose: that page is built around
 * tickets, attendees, check-ins and revenue, and reads `eventDays[0]` in several
 * places. A teaser has none of those, so it gets the only screen that makes
 * sense for it — its own edit form.
 */
export default async function ComingSoonEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const session = await auth();
  const t = await getTranslations("Events.coming_soon");
  const organisationId = session?.activeOrganisation.organisationId ?? "";

  let eventId: string;
  try {
    eventId = extractIdFromSlug(slug);
  } catch {
    return (
      <OrganizerLayout title={t("edit_title")}>
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/events`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": locale,
        origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
      cache: "no-store",
    },
  );

  // The API omits its data keys on error, so guard before reading.
  const response = await request.json().catch(() => null);
  const event: Event | undefined = (response?.events ?? []).find(
    (item: Event) => item.eventId === eventId,
  );

  if (!request.ok || !event) {
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
