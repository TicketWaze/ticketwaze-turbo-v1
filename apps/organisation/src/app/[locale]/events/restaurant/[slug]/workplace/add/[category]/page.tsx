import { notFound } from "next/navigation";
import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Restaurant } from "@ticketwaze/typescript-config";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import { extractIdFromSlug } from "@/lib/Slugify";
import CatalogContent from "./CatalogContent";
import type { CatalogItem } from "../../types";

/**
 * The food (or drink) page: everything the venue has added in this category,
 * and the button that adds more. One screen rather than a separate "add" flow
 * and a separate list of the same rows.
 */
export default async function AddItemPage({
  params,
}: {
  params: Promise<{ slug: string; category: string }>;
}) {
  const { slug, category } = await params;
  if (category !== "food" && category !== "drink") notFound();

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

  const [restaurantRequest, itemsRequest] = await Promise.all([
    fetch(restaurantBase, { method: "GET", headers, cache: "no-store" }),
    fetch(`${restaurantBase}/items?category=${category}`, {
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

  const itemsResponse = await itemsRequest.json().catch(() => null);
  const items: CatalogItem[] = itemsResponse?.items ?? [];
  const restaurant: Restaurant = restaurantResponse.restaurant;

  return (
    <OrganizerLayout title={t(`yours_${category}`)}>
      <CatalogContent
        restaurant={restaurant}
        category={category}
        items={items}
      />
    </OrganizerLayout>
  );
}
