"use client";
import { Clock, Location } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { Restaurant } from "@ticketwaze/typescript-config";
import { slugify } from "@/lib/Slugify";
import ActivityCard, { CardBadge, CardMeta } from "./ActivityCard";

const ICON = { size: "15", color: "#2e3237", variant: "Bulk" } as const;

/** 'HH:mm:ss' -> 'HH:mm'. */
function trimSeconds(time: string) {
  return time.slice(0, 5);
}

/**
 * Review states first, then the visibility switches the organisation can act
 * on, so an unlisted or suspended venue is never a mystery. A listed, approved
 * venue wears nothing.
 */
function restaurantBadge(
  restaurant: Restaurant,
  t: (key: string) => string,
): CardBadge | null {
  if (restaurant.adminStatus === "requested")
    return { label: t("badge.requested"), tone: "neutral" };
  if (restaurant.adminStatus === "review")
    return { label: t("badge.review"), tone: "warning" };
  if (restaurant.adminStatus === "rejected")
    return { label: t("badge.rejected"), tone: "failure" };
  if (restaurant.suspendedAt)
    return { label: t("restaurantCard.suspended"), tone: "failure" };
  if (restaurant.isPermanentlyClosed)
    return { label: t("restaurantCard.closed_permanently"), tone: "neutral" };
  if (!restaurant.isListed)
    return { label: t("restaurantCard.unlisted"), tone: "muted" };
  return null;
}

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const t = useTranslations("Events");
  const open = restaurant.openState;
  const isOpen = restaurant.alwaysOpen || open?.isOpen;

  const hours = restaurant.alwaysOpen
    ? t("restaurantCard.always_open")
    : open?.today
      ? `${trimSeconds(open.today.opensAt)} - ${trimSeconds(open.today.closesAt)}`
      : t("restaurantCard.no_hours");

  return (
    <ActivityCard
      href={`/events/restaurant/${slugify(restaurant.name, restaurant.restaurantId)}`}
      imageUrl={restaurant.coverImageUrl}
      title={restaurant.name}
      badge={restaurantBadge(restaurant, t)}
      meta={[
        <CardMeta key="h" icon={<Clock {...ICON} />}>
          {hours}
        </CardMeta>,
        restaurant.city ? (
          <CardMeta key="c" icon={<Location {...ICON} />}>
            {restaurant.city}
          </CardMeta>
        ) : undefined,
      ]}
      // A venue has no single price; where the others show one, it shows
      // whether it is serving right now — the live signal an owner looks for.
      price={
        <p
          className={`font-sans font-bold text-[1.2rem] leading-6 ${isOpen ? "text-success" : "text-neutral-700"}`}
        >
          {isOpen ? t("restaurantCard.open") : t("restaurantCard.closed")}
        </p>
      }
    />
  );
}

export default RestaurantCard;
