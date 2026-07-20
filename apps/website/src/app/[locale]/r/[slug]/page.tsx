import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PublicMenu from "./PublicMenu";

interface MenuItem {
  itemId: string;
  name: string;
  description: string | null;
  price: number;
  usdPrice: number;
  currency: string;
  imageUrl: string | null;
  isAvailable: boolean;
  dietaryTags: string[];
  spiceLevel: number | null;
}

interface MenuSection {
  sectionId: string;
  name: string;
  description: string | null;
  items: MenuItem[];
}

export interface PublicMenuData {
  menuId: string;
  name: string;
  description: string | null;
  servesFrom: string | null;
  servesUntil: string | null;
  isServedNow: boolean;
  sections: MenuSection[];
}

export interface PublicRestaurant {
  restaurantId: string;
  name: string;
  slug: string;
  description: string;
  establishmentType: string;
  cuisineTypes: string[];
  address: string;
  city: string;
  location: { lat: number; lng: number } | null;
  phone: string | null;
  whatsapp: string | null;
  coverImageUrl: string | null;
  images?: { imageId: string; imageUrl: string; caption: string | null }[];
  hours: { dayOfWeek: number; opensAt: string; closesAt: string }[];
  alwaysOpen: boolean;
  acceptsReservations: boolean;
  offersDelivery: boolean;
  offersTakeout: boolean;
  deliveryPhone: string | null;
  deliveryZones: string[] | null;
  isPermanentlyClosed: boolean;
  openState?: { isOpen: boolean; today: { opensAt: string; closesAt: string } | null };
}

async function fetchRestaurant(slug: string, locale: string) {
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/explore/restaurants/${slug}`,
    {
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": locale,
      },
      // The QR is scanned constantly and the payload changes rarely; a short
      // revalidate keeps it cheap without serving a stale "86'd" item for long.
      next: { revalidate: 60 },
    },
  );
  // The API omits its data keys on error, so guard before reading.
  const response = await request.json().catch(() => null);
  if (!request.ok || !response?.restaurant) return null;
  return {
    restaurant: response.restaurant as PublicRestaurant,
    menus: (response.menus ?? []) as PublicMenuData[],
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const data = await fetchRestaurant(slug, locale);
  if (!data) return { title: "Ticketwaze" };

  const { restaurant } = data;
  return {
    title: `${restaurant.name} — Menu`,
    description: restaurant.description?.replace(/<[^>]*>/g, "").slice(0, 160),
    openGraph: {
      title: restaurant.name,
      images: restaurant.coverImageUrl ? [restaurant.coverImageUrl] : undefined,
    },
  };
}

/**
 * The QR target. Server-rendered with no client JS beyond the menu switcher, so
 * it loads fast on a phone with a poor connection — which is the only situation
 * this page is ever opened in.
 */
export default async function RestaurantMenuPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const t = await getTranslations("PublicMenu");
  const data = await fetchRestaurant(slug, locale);

  if (!data) notFound();

  const { restaurant, menus } = data;

  // A closed-down venue gets a tombstone rather than a 404: someone is standing
  // in front of the building holding a printed code, and "not found" tells them
  // nothing useful.
  if (restaurant.isPermanentlyClosed) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-8 text-center">
        <h1 className="font-primary font-medium text-[2.6rem] leading-12 text-black">
          {restaurant.name}
        </h1>
        <p className="text-[1.6rem] leading-9 text-neutral-600 max-w-[42rem]">
          {t("permanently_closed")}
        </p>
      </main>
    );
  }

  return <PublicMenu restaurant={restaurant} menus={menus} />;
}
