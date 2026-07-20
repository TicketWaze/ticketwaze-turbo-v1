"use client";
import { Clock, Location, Shop } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Restaurant } from "@ticketwaze/typescript-config";
import { Link } from "@/i18n/navigation";
import { slugify } from "@/lib/Slugify";

/** 'HH:mm:ss' -> 'HH:mm'. */
function trimSeconds(time: string) {
  return time.slice(0, 5);
}

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const t = useTranslations("Events");
  const open = restaurant.openState;

  // A restaurant never ends, so unlike an event there is no date to show. The
  // useful "when" is whether it is serving right now.
  const hoursLabel = restaurant.alwaysOpen
    ? t("restaurantCard.always_open")
    : open?.today
      ? `${trimSeconds(open.today.opensAt)} - ${trimSeconds(open.today.closesAt)}`
      : t("restaurantCard.no_hours");

  return (
    <Link
      href={`/events/restaurant/${slugify(restaurant.name, restaurant.restaurantId)}`}
      className="flex flex-row items-center lg:items-stretch lg:mb-8 lg:ml-4 lg:flex-col gap-4 w-full lg:max-w-140 bg-white shadow-lg rounded-2xl overflow-hidden pb-4 pl-4 lg:pl-0">
      <div className="relative">
        {restaurant.coverImageUrl && (
          <Image
            src={restaurant.coverImageUrl}
            className="h-62 lg:h-[19.1rem] flex-1 lg:flex-auto w-62 lg:w-full object-cover object-top-left rounded-2xl"
            alt={restaurant.name}
            height={191}
            width={255}
          />
        )}
        {restaurant.adminStatus === "requested" && (
          <div className="bg-neutral-900 block absolute top-4 right-4 py-1 px-4 rounded-[30px] text-[1rem] text-white font-primary font-bold leading-6 w-fit">
            {restaurant.adminStatus.toUpperCase()}
          </div>
        )}
        {restaurant.adminStatus === "review" && (
          <div className="bg-warning block absolute top-4 right-4 py-1 px-4 rounded-[30px] text-[1rem] text-white font-primary font-bold leading-6 w-fit">
            {restaurant.adminStatus.toUpperCase()}
          </div>
        )}
        {restaurant.adminStatus === "approved" && (
          <div className="bg-success block absolute top-4 right-4 py-1 px-4 rounded-[30px] text-[1rem] text-white font-primary font-bold leading-6 w-fit">
            {restaurant.adminStatus.toUpperCase()}
          </div>
        )}
        {restaurant.adminStatus === "rejected" && (
          <div className="bg-failure block absolute top-4 right-4 py-1 px-4 rounded-[30px] text-[1rem] text-white font-primary font-bold leading-6 w-fit">
            {restaurant.adminStatus.toUpperCase()}
          </div>
        )}
        <div className="bg-primary-50 block absolute bottom-4 right-4 py-1 px-4 rounded-[30px] text-[1rem] text-primary-500 font-primary font-bold leading-6 w-fit">
          {t("restaurantCard.tag").toUpperCase()}
        </div>
      </div>

      <div className="px-4 flex flex-1 lg:flex-auto min-w-0 flex-col gap-6 lg:gap-4">
        {restaurant.cuisineTypes?.length > 0 && (
          <ul className="hidden lg:flex gap-2 text-primary-500 font-medium">
            {restaurant.cuisineTypes.slice(0, 3).map((cuisine, key) => (
              <li key={key}>#{cuisine}</li>
            ))}
          </ul>
        )}
        <div className="flex flex-col w-full gap-1">
          <h1 className="font-bold w-full truncate font-primary text-[1.2rem] text-deep-100 leading-6">
            {restaurant.name}
          </h1>
          {restaurant.cuisineTypes?.length > 0 && (
            <ul className="flex gap-2 lg:hidden text-primary-500 font-medium">
              {restaurant.cuisineTypes.slice(0, 2).map((cuisine, key) => (
                <li key={key}>#{cuisine}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size="15" color="#2e3237" variant="Bulk" />
            <span className="font-medium text-[1rem] text-deep-100 leading-6">
              {hoursLabel}
            </span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <Location size="15" color="#2e3237" variant="Bulk" />
            <p className="font-medium truncate text-[1rem] text-deep-100 leading-6">
              {restaurant.city}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Open/closed is the live signal a venue owner scans for first. */}
          {(restaurant.alwaysOpen || open?.isOpen) && (
            <span className="bg-success/10 text-success py-1 px-4 rounded-[30px] text-[1rem] font-primary font-bold leading-6">
              {t("restaurantCard.open").toUpperCase()}
            </span>
          )}
          {!restaurant.alwaysOpen && open && !open.isOpen && (
            <span className="bg-neutral-100 text-neutral-700 py-1 px-4 rounded-[30px] text-[1rem] font-primary font-bold leading-6">
              {t("restaurantCard.closed").toUpperCase()}
            </span>
          )}
          {restaurant.acceptsReservations && (
            <span className="flex items-center gap-2 text-[1rem] font-medium text-neutral-700">
              <Shop size="14" color="#737c8a" variant="Bulk" />
              {t("restaurantCard.reservations")}
            </span>
          )}
          {restaurant.offersDelivery && (
            <span className="text-[1rem] font-medium text-neutral-700">
              {t("restaurantCard.delivery")}
            </span>
          )}
          {/* Visibility is four independent switches; surface the two the
              organisation can act on so an unlisted venue is never a mystery. */}
          {restaurant.suspendedAt && (
            <span className="bg-failure/10 text-failure py-1 px-4 rounded-[30px] text-[1rem] font-primary font-bold leading-6">
              {t("restaurantCard.suspended").toUpperCase()}
            </span>
          )}
          {!restaurant.suspendedAt && !restaurant.isListed && (
            <span className="bg-neutral-100 text-neutral-700 py-1 px-4 rounded-[30px] text-[1rem] font-primary font-bold leading-6">
              {t("restaurantCard.unlisted").toUpperCase()}
            </span>
          )}
          {restaurant.isPermanentlyClosed && (
            <span className="bg-neutral-900 text-white py-1 px-4 rounded-[30px] text-[1rem] font-primary font-bold leading-6">
              {t("restaurantCard.closed_permanently").toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default RestaurantCard;
