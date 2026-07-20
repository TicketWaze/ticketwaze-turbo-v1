import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Restaurant } from "@ticketwaze/typescript-config";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import { extractIdFromSlug } from "@/lib/Slugify";
import RestaurantOverview from "./RestaurantOverview";

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslations("Events.restaurantDetail");
  const locale = await getLocale();
  const session = await auth();

  let restaurantId: string;
  try {
    restaurantId = extractIdFromSlug(slug);
  } catch {
    return (
      <OrganizerLayout title={t("not_found")}>
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/restaurants/${session?.activeOrganisation.organisationId}/${restaurantId}`,
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
  if (request.status === 403) {
    return <UnauthorizedView />;
  }

  // The API omits `data` keys on error, so an unguarded read crashes the page.
  const response = await request.json().catch(() => null);
  if (!request.ok || !response?.restaurant) {
    return (
      <OrganizerLayout title={t("not_found")}>
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }

  const restaurant: Restaurant = response.restaurant;
  return (
    <OrganizerLayout title={restaurant.name}>
      <RestaurantOverview
        restaurant={restaurant}
        transactions={response.transactions ?? []}
        stats={
          response.stats ?? {
            currency: restaurant.reservationFeeCurrency,
            revenue: 0,
            monthRevenue: 0,
            transactionCount: 0,
            averageSale: 0,
          }
        }
      />
    </OrganizerLayout>
  );
}
