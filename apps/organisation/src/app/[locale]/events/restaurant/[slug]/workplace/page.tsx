import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Restaurant } from "@ticketwaze/typescript-config";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import { extractIdFromSlug } from "@/lib/Slugify";
import WorkplaceContent from "./WorkplaceContent";
import type { CatalogItem, CustomerTab, DayTotals, ServiceDay } from "./types";

export default async function WorkplacePage({
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

  // The catalogue rides along with the tabs: adding a dish to a check is the
  // most common action here and it should not wait on a second round trip.
  // Tabs come back scoped to the open day, or empty when there is none.
  const [restaurantRequest, dayRequest, tabsRequest, itemsRequest] =
    await Promise.all([
      fetch(restaurantBase, { method: "GET", headers, cache: "no-store" }),
      fetch(`${restaurantBase}/service-days/current`, {
        method: "GET",
        headers,
        cache: "no-store",
      }),
      fetch(`${restaurantBase}/tabs`, {
        method: "GET",
        headers,
        cache: "no-store",
      }),
      fetch(`${restaurantBase}/items`, {
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

  const dayResponse = await dayRequest.json().catch(() => null);
  const tabsResponse = await tabsRequest.json().catch(() => null);
  const itemsResponse = await itemsRequest.json().catch(() => null);

  const day: ServiceDay | null = dayResponse?.day ?? null;
  const totals: DayTotals | null = dayResponse?.totals ?? null;
  const tabs: CustomerTab[] = tabsResponse?.tabs ?? [];
  const catalog: CatalogItem[] = itemsResponse?.items ?? [];
  const restaurant: Restaurant = restaurantResponse.restaurant;

  return (
    <OrganizerLayout title={t("title")}>
      <WorkplaceContent
        restaurant={restaurant}
        slug={slug}
        day={day}
        totals={totals}
        tabs={tabs}
        catalog={catalog}
      />
    </OrganizerLayout>
  );
}
