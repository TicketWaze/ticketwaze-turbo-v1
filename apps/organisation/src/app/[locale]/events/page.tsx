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
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations/${session?.activeOrganisation.organisationId}/events`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": locale,
        origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    },
  );
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

  // Raffles live in their own table but share the activities list with events.
  let raffles = [];
  try {
    const rafflesRequest = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/raffles/${session?.activeOrganisation.organisationId}`,
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
    const rafflesResponse = await rafflesRequest.json();
    raffles = rafflesResponse.raffles ?? [];
  } catch {
    raffles = [];
  }
  // Restaurants are the third activity type and share the activities list.
  let restaurants = [];
  try {
    const restaurantsRequest = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/restaurants/${session?.activeOrganisation.organisationId}`,
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
    const restaurantsResponse = await restaurantsRequest.json();
    restaurants = restaurantsResponse.restaurants ?? [];
  } catch {
    restaurants = [];
  }

  // Digital products are the fourth activity type and share the activities list.
  let sales = [];
  try {
    const salesRequest = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/sales/${session?.activeOrganisation.organisationId}`,
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
    const salesResponse = await salesRequest.json();
    // The sales endpoint answers under `data`, and omits the key entirely on
    // an error — so this cannot be a bare property read.
    sales = salesResponse.data ?? [];
  } catch {
    sales = [];
  }

  // Views and tickets sold per activity, for the Popularity sort. Optional:
  // without it the list still works and Popularity keeps the default order.
  let stats: ActivityStats = {};
  try {
    const statsRequest = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${session?.activeOrganisation.organisationId}/activity-stats`,
      {
        headers: {
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
          Authorization: `Bearer ${session?.user.accessToken}`,
        },
        cache: "no-store",
      },
    );
    stats = (await statsRequest.json()).stats ?? {};
  } catch {
    stats = {};
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
