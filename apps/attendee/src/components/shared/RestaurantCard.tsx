"use client";
import { Clock, Location } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Restaurant } from "@ticketwaze/typescript-config";
import { Link } from "@/i18n/navigation";

/** 'HH:mm:ss' -> 'HH:mm'. */
function trimSeconds(time: string) {
  return time.slice(0, 5);
}

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const t = useTranslations("Event");
  const open = restaurant.openState;

  // A venue never ends, so unlike an event there is no date to lead with. The
  // useful "when" is whether it is serving right now.
  const hoursLabel = restaurant.alwaysOpen
    ? t("restaurantCard.always_open")
    : open?.today
      ? `${trimSeconds(open.today.opensAt)} - ${trimSeconds(open.today.closesAt)}`
      : t("restaurantCard.closed_today");

  return (
    <Link
      href={`/explore/restaurant/${restaurant.slug}`}
      className="flex flex-row items-center lg:items-stretch lg:mb-8 lg:ml-4 lg:flex-col gap-4 w-full lg:max-w-140 bg-white shadow-lg rounded-[10px] overflow-hidden pb-4 pl-4 lg:pl-0">
      <div className="relative">
        {restaurant.coverImageUrl && (
          <Image
            src={restaurant.coverImageUrl}
            className="h-62 lg:max-h-[19.1rem] flex-1 lg:flex-auto w-62 lg:w-full object-cover object-top-left rounded-[10px]"
            alt={restaurant.name}
            height={191}
            width={255}
          />
        )}
        <div className="bg-primary-50 block absolute bottom-4 right-4 py-1 px-4 rounded-[30px] text-[1rem] text-primary-500 font-primary font-bold leading-6 w-fit">
          {t("restaurantCard.tag").toUpperCase()}
        </div>
        {(restaurant.alwaysOpen || open?.isOpen) && (
          <div className="bg-success block absolute top-4 right-4 py-1 px-4 rounded-[30px] text-[1rem] text-white font-primary font-bold leading-6 w-fit">
            {t("restaurantCard.open").toUpperCase()}
          </div>
        )}
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
      </div>
    </Link>
  );
}

export default RestaurantCard;
