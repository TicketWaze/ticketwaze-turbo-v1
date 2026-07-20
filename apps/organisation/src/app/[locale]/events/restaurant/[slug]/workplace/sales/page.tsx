import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Restaurant } from "@ticketwaze/typescript-config";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import { extractIdFromSlug } from "@/lib/Slugify";
import SalesHistory from "./SalesHistory";
import type { ServiceDay } from "../types";

/**
 * Daily sales. Every row is a day the venue closed by hand, with the figures
 * frozen at that moment — a closed day reports the same numbers next year, even
 * after the menu has been repriced.
 */
export default async function SalesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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

  const [restaurantRequest, daysRequest] = await Promise.all([
    fetch(restaurantBase, { method: "GET", headers, cache: "no-store" }),
    fetch(`${restaurantBase}/service-days`, {
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
  if (!restaurantRequest.ok || !restaurantResponse?.restaurant) {
    return (
      <OrganizerLayout title={td("not_found")}>
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }

  const daysResponse = await daysRequest.json().catch(() => null);
  const days: ServiceDay[] = daysResponse?.days ?? [];
  const restaurant: Restaurant = restaurantResponse.restaurant;

  return (
    <OrganizerLayout title={t("sales_history")}>
      <SalesHistory restaurant={restaurant} days={days} />
    </OrganizerLayout>
  );
}
