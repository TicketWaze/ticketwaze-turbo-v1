"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Restaurant } from "@ticketwaze/typescript-config";
import { slugify } from "@/lib/Slugify";
import { formatMoney } from "@ticketwaze/currency";
import { Clock, Location, Shop } from "iconsax-reactjs";
import { Link } from "@/i18n/navigation";
import Separator from "@/components/shared/Separator";
import EventImageLightbox from "@/components/shared/EventImageLightbox";
import VerifiedOrganisationCheckMark from "@/components/VerifiedOrganisationCheckMark";
import MapComponent from "../../[slug]/MapComponent";
import FollowButton from "../../[slug]/FollowButton";
import RestaurantActions from "./RestaurantActions";

export interface AttendeeMenu {
  menuId: string;
  name: string;
  description: string | null;
  isServedNow: boolean;
  sections: {
    sectionId: string;
    name: string;
    description: string | null;
    items: {
      itemId: string;
      name: string;
      description: string | null;
      price: number;
      usdPrice: number;
      currency: string;
      imageUrl: string | null;
      isAvailable: boolean;
      dietaryTags: string[];
    }[];
  }[];
}

export interface RestaurantOrganisation {
  organisationId: string;
  organisationName: string;
  profileImageUrl: string | null;
  isVerified?: boolean;
  followers?: { userId: string }[];
}

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function trimSeconds(time: string) {
  return time.slice(0, 5);
}

/** The icon-in-a-circle row the event page uses throughout its details rail. */
function DetailRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={"flex items-center gap-2"}>
      <div
        className={
          "w-14 h-14 shrink-0 flex items-center justify-center bg-neutral-100 rounded-full"
        }
      >
        {icon}
      </div>
      <span className={"font-normal text-[1.4rem] leading-8 text-deep-200"}>
        {children}
      </span>
    </div>
  );
}

export default function RestaurantDetail({
  restaurant,
  organisation,
  menus,
  isFavorite,
  isFollowing,
}: {
  restaurant: Restaurant;
  organisation: RestaurantOrganisation | null;
  menus: AttendeeMenu[];
  isFavorite: boolean;
  isFollowing: boolean;
}) {
  const t = useTranslations("Event.restaurantDetail");
  const te = useTranslations("Event");
  const locale = useLocale();

  // Open on whatever is being served right now, not on whichever menu sorts
  // first — someone browsing at 21:00 wants dinner, not breakfast.
  const initialMenu = menus.find((m) => m.isServedNow) ?? menus[0];
  const [activeMenuId, setActiveMenuId] = useState(initialMenu?.menuId);
  const activeMenu =
    menus.find((m) => m.menuId === activeMenuId) ?? initialMenu;

  const open = restaurant.openState;
  const isOpen = restaurant.alwaysOpen || open?.isOpen;

  /**
   * Rendered twice: in the desktop rail, and again inside the left column on
   * mobile where the rail is hidden. Same approach the event page takes.
   */
  const details = (
    <div className={"flex flex-col gap-8"}>
      <span className={"font-semibold text-[1.6rem] leading-8 text-deep-200"}>
        {t("details")}
      </span>

      {organisation && (
        <div className={"flex items-center justify-between w-full"}>
          <Link
            href={`/organisations/${slugify(organisation.organisationName, organisation.organisationId)}`}
            className={"flex items-center gap-4"}
          >
            {organisation.profileImageUrl ? (
              <Image
                src={organisation.profileImageUrl}
                width={35}
                height={35}
                alt={organisation.organisationName}
                className="rounded-full"
              />
            ) : (
              <span className="w-14 h-14 flex items-center justify-center bg-black rounded-full text-white uppercase font-medium text-[2.2rem] leading-12 font-primary">
                {organisation.organisationName.slice()[0]?.toUpperCase()}
              </span>
            )}
            <div className={"flex flex-col"}>
              <span
                className={"font-normal text-[1.4rem] leading-8 text-deep-200"}
              >
                {organisation.organisationName}{" "}
                {organisation.isVerified && <VerifiedOrganisationCheckMark />}
              </span>
              <span
                className={
                  "font-normal text-[1.3rem] leading-8 text-neutral-600"
                }
              >
                {organisation.followers?.length ?? 0} {te("followers")}
              </span>
            </div>
          </Link>
          <FollowButton
            organisationId={restaurant.organisationId}
            initialIsFollowing={isFollowing}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <DetailRow icon={<Clock size="20" color="#737c8a" variant="Bulk" />}>
          {restaurant.alwaysOpen
            ? t("always_open")
            : open?.today
              ? `${t("today")}: ${trimSeconds(open.today.opensAt)} - ${trimSeconds(open.today.closesAt)}`
              : t("closed_today")}
        </DetailRow>
        <DetailRow icon={<Location size="20" color="#737c8a" variant="Bulk" />}>
          {restaurant.address}, {restaurant.city}
        </DetailRow>
        {restaurant.offersDelivery && (
          <DetailRow icon={<Shop size="20" color="#737c8a" variant="Bulk" />}>
            {t("delivery_available")}
          </DetailRow>
        )}
      </div>

      {/* Full week */}
      {!restaurant.alwaysOpen && restaurant.hours?.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-col gap-2">
            <span
              className={"font-semibold text-[1.6rem] leading-8 text-deep-200"}
            >
              {t("hours")}
            </span>
            <ul className="flex flex-col">
              {DAY_ORDER.map((day) => {
                const row = restaurant.hours.find((h) => h.dayOfWeek === day);
                return (
                  <li
                    key={day}
                    className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0"
                  >
                    <span className="text-[1.4rem] text-neutral-600">
                      {t(`days.${day}`)}
                    </span>
                    <span className="text-[1.4rem] text-deep-200">
                      {row
                        ? `${trimSeconds(row.opensAt)} - ${trimSeconds(row.closesAt)}`
                        : t("closed")}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}

      <Separator />
      {/* Location is optional on the venue record today. Rather than silently
          dropping the map, say so — an address with no pin is a real gap the
          venue can fix. */}
      {restaurant.location ? (
        <MapComponent location={restaurant.location} />
      ) : (
        <div className="rounded-[10px] bg-neutral-100 px-6 py-8 flex flex-col gap-2">
          <span className="font-normal text-[1.4rem] leading-8 text-deep-200">
            {t("no_location")}
          </span>
          <span className="text-[1.3rem] leading-7 text-neutral-600">
            {restaurant.address}, {restaurant.city}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <main className="w-full gap-8 flex flex-col lg:grid lg:grid-cols-[29fr_23fr] lg:min-h-0 lg:overflow-y-auto lg:h-full">
      {/* Left column */}
      <div className="flex flex-col gap-8 overflow-y-auto min-h-0">
        {restaurant.coverImageUrl && (
          <EventImageLightbox
            src={restaurant.coverImageUrl}
            alt={restaurant.name}
            width={580}
            height={298}
          />
        )}

        {/* Identity before the action row: the venue has to be named before
            "Share" or "Reserve a table" mean anything. */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="font-primary font-medium text-[2.2rem] lg:text-[2.6rem] leading-12 text-black">
              {restaurant.name}
            </h1>
            <span
              className={`py-1 px-4 rounded-[30px] text-[1rem] font-primary font-bold leading-6 uppercase ${
                isOpen
                  ? "bg-success/10 text-success"
                  : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {isOpen ? t("open") : t("closed")}
            </span>
          </div>

          {restaurant.cuisineTypes?.length > 0 && (
            <ul className="flex flex-wrap gap-2 text-primary-500 font-medium text-[1.3rem]">
              {restaurant.cuisineTypes.map((cuisine, key) => (
                <li key={key}>#{cuisine}</li>
              ))}
            </ul>
          )}
        </div>

        <RestaurantActions restaurant={restaurant} isFavorite={isFavorite} />

        {restaurant.description && (
          <>
            <Separator />
            <div className="flex flex-col gap-4">
              <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                {t("about")}
              </span>
              <div
                className="rich-text text-[1.6rem] font-sans leading-10 text-neutral-700"
                dangerouslySetInnerHTML={{ __html: restaurant.description }}
              />
            </div>
          </>
        )}

        {/* Menu — the reason most people open this page. */}
        {menus.length > 0 && (
          <>
            <Separator />
            <section className="flex flex-col gap-6">
              <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                {t("menu")}
              </span>

              {menus.length > 1 && (
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                  {menus.map((menu) => (
                    <button
                      key={menu.menuId}
                      type="button"
                      onClick={() => setActiveMenuId(menu.menuId)}
                      className={`shrink-0 px-6 py-3 rounded-[30px] text-[1.4rem] font-medium leading-8 transition-colors cursor-pointer ${
                        activeMenu?.menuId === menu.menuId
                          ? "bg-primary-500 text-white"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {menu.name}
                    </button>
                  ))}
                </div>
              )}

              {activeMenu?.sections.map((section) => (
                <div key={section.sectionId} className="flex flex-col gap-2">
                  <h2 className="font-primary font-medium text-[1.6rem] leading-10 text-black">
                    {section.name}
                  </h2>
                  <ul className="flex flex-col divide-y divide-neutral-100">
                    {section.items.map((item) => (
                      <li
                        key={item.itemId}
                        // Sold out is greyed, never hidden — hiding it reads as
                        // the venue having dropped the dish entirely.
                        className={`flex items-start gap-4 py-5 ${
                          item.isAvailable ? "" : "opacity-45"
                        }`}
                      >
                        {item.imageUrl && (
                          <EventImageLightbox
                            src={item.imageUrl}
                            alt={item.name}
                            width={400}
                            height={400}
                            triggerClassName="w-24 h-24 shrink-0 overflow-hidden rounded-[10px] cursor-zoom-in block"
                          />
                        )}
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <div className="flex items-baseline justify-between gap-4">
                            <span className="text-[1.5rem] font-medium leading-8 text-deep-100">
                              {item.name}
                            </span>
                            <span className="text-[1.5rem] font-medium leading-8 text-primary-500 shrink-0">
                              {formatMoney(
                                item.currency === "USD"
                                  ? item.usdPrice
                                  : item.price,
                                item.currency,
                                locale,
                              )}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-[1.3rem] leading-7 text-neutral-600">
                              {item.description}
                            </p>
                          )}
                          {!item.isAvailable && (
                            <span className="text-[1.1rem] font-bold uppercase text-neutral-500">
                              {t("unavailable")}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          </>
        )}

        {/* Gallery */}
        {restaurant.images && restaurant.images.length > 0 && (
          <>
            <Separator />
            <section className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {restaurant.images.map((image) => (
                <EventImageLightbox
                  key={image.imageId}
                  src={image.imageUrl}
                  alt={image.caption ?? restaurant.name}
                  width={600}
                  height={400}
                  triggerClassName="w-full h-40 overflow-hidden rounded-[10px] cursor-zoom-in block"
                />
              ))}
            </section>
          </>
        )}

        {/* The rail is desktop-only, so its content repeats here on mobile. */}
        <div className="lg:hidden flex flex-col gap-8">
          <Separator />
          {details}
        </div>
      </div>

      {/* Right rail */}
      <div className="hidden lg:flex lg:flex-col lg:overflow-y-auto min-h-0 flex-col gap-8 p-4 pt-0">
        {details}
      </div>
    </main>
  );
}
