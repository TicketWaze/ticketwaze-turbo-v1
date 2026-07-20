import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Restaurant } from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";
import AnimatedEventPage from "../../[slug]/AnimatedEventPage";
import { auth } from "@/lib/auth";
import RestaurantDetail, {
  type AttendeeMenu,
  type RestaurantOrganisation,
} from "./RestaurantDetail";

async function fetchRestaurant(slug: string, locale: string) {
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/explore/restaurants/${slug}`,
    {
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": locale,
      },
      next: { revalidate: 60 },
    },
  );
  // The API omits its data keys on error, so guard before reading.
  const response = await request.json().catch(() => null);
  if (!request.ok || !response?.restaurant) return null;
  return {
    restaurant: response.restaurant as Restaurant,
    organisation: (response.organisation ?? null) as RestaurantOrganisation | null,
    menus: (response.menus ?? []) as AttendeeMenu[],
  };
}

/**
 * Favourites are keyed on the activity id and a restaurant's id IS its activity
 * id, so the existing events endpoint serves restaurants unchanged. Signed-out
 * visitors simply get false rather than an error.
 */
async function fetchIsFavorite(activityId: string, accessToken?: string) {
  if (!accessToken) return false;
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${activityId}/favorite`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );
    const response = await request.json().catch(() => null);
    return response?.isFavorite === true;
  } catch {
    return false;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const data = await fetchRestaurant(slug, locale);
  if (!data) return { title: "Ticketwaze" };
  return {
    title: data.restaurant.name,
    description: data.restaurant.description
      ?.replace(/<[^>]*>/g, "")
      .slice(0, 160),
  };
}

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("Event.restaurantDetail");
  const session = await auth();
  const data = await fetchRestaurant(slug, locale);

  if (!data) notFound();

  const isFavorite = await fetchIsFavorite(
    data.restaurant.restaurantId,
    session?.user.accessToken,
  );
  // Derived from the followers pivot the API sends, same as the event page —
  // no extra round trip.
  const isFollowing = Boolean(
    data.organisation?.followers?.some(
      (follower) => follower.userId === session?.user.userId,
    ),
  );

  // AnimatedEventPage supplies the `h-full min-h-0` that the two-column grid
  // below needs to scroll each side independently — without it the rail grows
  // the page instead of scrolling.
  return (
    <AttendeeLayout title={data.restaurant.name}>
      <AnimatedEventPage>
        <BackButton text={t("back")} />
        <RestaurantDetail
          restaurant={data.restaurant}
          organisation={data.organisation}
          menus={data.menus}
          isFavorite={isFavorite}
          isFollowing={isFollowing}
        />
      </AnimatedEventPage>
    </AttendeeLayout>
  );
}
