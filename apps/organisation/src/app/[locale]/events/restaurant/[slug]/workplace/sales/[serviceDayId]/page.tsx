import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Restaurant } from "@ticketwaze/typescript-config";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import { extractIdFromSlug } from "@/lib/Slugify";
import ServiceDayDetailView from "./ServiceDayDetailView";
import type { ServiceDayDetail } from "../../types";

/**
 * One day's operations, opened from a row in the daily sales list.
 *
 * The API returns the day with its tabs and their lines already preloaded, so
 * this is a single read — there is no separate "tabs for day" call to make.
 */
export default async function ServiceDayPage({
  params,
}: {
  params: Promise<{ slug: string; serviceDayId: string }>;
}) {
  const { slug, serviceDayId } = await params;
  const t = await getTranslations("Events.workplace");
  const td = await getTranslations("Events.restaurantDetail");
  const locale = await getLocale();
  const session = await auth();
  const organisationId = session?.activeOrganisation.organisationId;

  let restaurantId: string;
  try {
    restaurantId = extractIdFromSlug(slug);
  } catch {
    return (
      <OrganizerLayout title={td("not_found")}>
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }

  const headers = {
    "Content-Type": "application/json",
    "Accept-Language": locale,
    origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
    Authorization: `Bearer ${session?.user.accessToken}`,
  };

  const restaurantBase = `${process.env.NEXT_PUBLIC_API_URL}/restaurants/${organisationId}/${restaurantId}`;

  const [restaurantRequest, dayRequest] = await Promise.all([
    fetch(restaurantBase, { method: "GET", headers, cache: "no-store" }),
    fetch(`${restaurantBase}/service-days/${serviceDayId}`, {
      method: "GET",
      headers,
      cache: "no-store",
    }),
  ]);

  if (restaurantRequest.status === 403) {
    return <UnauthorizedView />;
  }

  // The API omits `data` keys on error, so an unguarded read crashes the page.
  const restaurantResponse = await restaurantRequest.json().catch(() => null);
  const dayResponse = await dayRequest.json().catch(() => null);
  const restaurant: Restaurant | undefined = restaurantResponse?.restaurant;
  const day: ServiceDayDetail | undefined = dayResponse?.day;

  if (!restaurantRequest.ok || !restaurant || !dayRequest.ok || !day) {
    return (
      <OrganizerLayout title={t("sales_history")}>
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout title={t("sales_history")}>
      <ServiceDayDetailView
        day={{ ...day, tabs: day.tabs ?? [] }}
        timezone={restaurant.timezone || "UTC"}
      />
    </OrganizerLayout>
  );
}
