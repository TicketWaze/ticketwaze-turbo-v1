/* eslint-disable @typescript-eslint/no-explicit-any */
import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale, getTranslations } from "next-intl/server";
import EventPageContent, { ActivityStats } from "./EventPageContent";
import { auth } from "@/lib/auth";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import { checkPermission } from "@/lib/role/permission";

export default async function EventPage() {
  const t = await getTranslations("Events");
  const locale = await getLocale();
  const session = await auth();
  const orgId = session?.activeOrganisation.organisationId;
  const api = process.env.NEXT_PUBLIC_API_URL;
  const headers = {
    "Content-Type": "application/json",
    "Accept-Language": locale,
    origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
    Authorization: `Bearer ${session?.user.accessToken}`,
  };
  // The extra lists are optional: a failure leaves that list empty (or, for
  // stats, Popularity on the default order) rather than failing the page.
  const optional = <T,>(url: string, pick: (body: any) => T, fallback: T) =>
    fetch(url, { headers, cache: "no-store" })
      .then((r) => r.json())
      .then((body) => pick(body) ?? fallback)
      .catch(() => fallback);

  // All five lists are independent, so they load side by side rather than
  // one after another.
  const [request, raffles, restaurants, sales, stats] = await Promise.all([
    fetch(`${api}/organisations/${orgId}/events`, { method: "GET", headers }),
    // Raffles live in their own table but share the activities list with events.
    optional(`${api}/raffles/${orgId}`, (b) => b.raffles, []),
    // Restaurants are the third activity type and share the activities list.
    optional(`${api}/restaurants/${orgId}`, (b) => b.restaurants, []),
    // Digital products are the fourth activity type. The sales endpoint
    // answers under `data`, and omits the key entirely on an error.
    optional(`${api}/sales/${orgId}`, (b) => b.data, []),
    // Views and tickets sold per activity, for the Popularity sort.
    optional<ActivityStats>(
      `${api}/organisations/${orgId}/activity-stats`,
      (b) => b.stats,
      {},
    ),
  ]);
  if (request.status === 403) {
    return <UnauthorizedView />;
  }
  const events = await request.json().catch(() => null);
  if (!request.ok || !events) {
    return (
      <OrganizerLayout title={t("title")}>
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }

  const perms = session?.activeOrganisation?.myPermissions ?? [];
  const canCreate = checkPermission(perms, "events.create");
  return (
    <OrganizerLayout title={t("title")}>
      <EventPageContent
        events={events.events}
        raffles={raffles}
        restaurants={restaurants}
        sales={sales}
        stats={stats}
        canCreate={canCreate}
      />
    </OrganizerLayout>
  );
}
