"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import ImageLightbox from "@/components/ImageLightbox";
import type { PublicMenuData, PublicRestaurant } from "./page";

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function trimSeconds(time: string) {
  return time.slice(0, 5);
}

function formatPrice(amount: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale === "fr" ? "fr-HT" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export default function PublicMenu({
  restaurant,
  menus,
}: {
  restaurant: PublicRestaurant;
  menus: PublicMenuData[];
}) {
  const t = useTranslations("PublicMenu");
  const locale = useLocale();

  // Open on whatever is actually being served right now — a guest scanning at
  // 21:00 should land on the dinner menu, not on breakfast because it sorts
  // first. Falls back to the first menu when nothing matches.
  const initialMenu = menus.find((m) => m.isServedNow) ?? menus[0];
  const [activeMenuId, setActiveMenuId] = useState(initialMenu?.menuId);
  const activeMenu = menus.find((m) => m.menuId === activeMenuId) ?? initialMenu;

  const isOpen = restaurant.alwaysOpen || restaurant.openState?.isOpen;
  const today = restaurant.openState?.today;

  const directionsUrl = restaurant.location
    ? `https://www.google.com/maps/search/?api=1&query=${restaurant.location.lat},${restaurant.location.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${restaurant.address}, ${restaurant.city}`,
      )}`;

  return (
    <main className="min-h-screen bg-white pb-24">
      {/* Cover */}
      {restaurant.coverImageUrl && (
        <ImageLightbox
          src={restaurant.coverImageUrl}
          alt={restaurant.name}
          triggerClassName="w-full h-[22rem] lg:h-[32rem] block overflow-hidden cursor-zoom-in"
          /* No hover scale on the cover: it is full-bleed, so a transform
             makes the whole banner twitch rather than lift a thumbnail. */
          imageClassName="w-full h-full object-cover"
        />
      )}

      <div className="max-w-[72rem] mx-auto px-6 lg:px-8">
        {/* Identity */}
        <header className="flex flex-col gap-4 pt-8 pb-10 border-b border-neutral-100">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="font-primary font-medium text-[2.6rem] leading-12 text-black">
              {restaurant.name}
            </h1>
            <span
              className={`py-1 px-4 rounded-[30px] text-[1.1rem] font-bold leading-6 uppercase ${
                isOpen
                  ? "bg-success/10 text-success"
                  : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {isOpen ? t("open") : t("closed")}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[1.4rem] text-neutral-600">
            <span className="capitalize">
              {restaurant.establishmentType.replace("_", " ")}
            </span>
            {restaurant.cuisineTypes?.length > 0 && (
              <span>{restaurant.cuisineTypes.join(" · ")}</span>
            )}
            <span>
              {restaurant.address}, {restaurant.city}
            </span>
          </div>

          {/* Today's hours — the thing a guest checks first after "is it open". */}
          <p className="text-[1.4rem] text-neutral-600">
            {restaurant.alwaysOpen
              ? t("always_open")
              : today
                ? `${t("today")}: ${trimSeconds(today.opensAt)} - ${trimSeconds(today.closesAt)}`
                : t("closed_today")}
          </p>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            {restaurant.phone && (
              <a
                href={`tel:${restaurant.phone}`}
                className="px-6 py-3 rounded-[30px] bg-primary-500 text-white text-[1.4rem] font-medium leading-8"
              >
                {t("call")}
              </a>
            )}
            {restaurant.whatsapp && (
              <a
                href={`https://wa.me/${restaurant.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-[30px] bg-neutral-100 text-neutral-700 text-[1.4rem] font-medium leading-8"
              >
                WhatsApp
              </a>
            )}
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-[30px] bg-neutral-100 text-neutral-700 text-[1.4rem] font-medium leading-8"
            >
              {t("directions")}
            </a>
          </div>

          {restaurant.offersDelivery && (
            <div className="mt-2 rounded-2xl bg-neutral-100 px-6 py-4 flex flex-col gap-1">
              <span className="text-[1.4rem] font-medium text-deep-100">
                {t("delivery_available")}
              </span>
              {restaurant.deliveryPhone && (
                <a
                  href={`tel:${restaurant.deliveryPhone}`}
                  className="text-[1.4rem] text-primary-500"
                >
                  {restaurant.deliveryPhone}
                </a>
              )}
              {restaurant.deliveryZones &&
                restaurant.deliveryZones.length > 0 && (
                  <span className="text-[1.3rem] text-neutral-600">
                    {restaurant.deliveryZones.join(" · ")}
                  </span>
                )}
            </div>
          )}
        </header>

        {/* Menus */}
        {menus.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-[1.6rem] leading-9 text-neutral-600">
              {t("no_menu")}
            </p>
          </div>
        ) : (
          <section className="pt-10">
            {menus.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-6 -mx-6 px-6">
                {menus.map((menu) => (
                  <button
                    key={menu.menuId}
                    type="button"
                    onClick={() => setActiveMenuId(menu.menuId)}
                    className={`shrink-0 px-6 py-3 rounded-[30px] text-[1.4rem] font-medium leading-8 transition-colors ${
                      activeMenu?.menuId === menu.menuId
                        ? "bg-primary-500 text-white"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {menu.name}
                    {menu.isServedNow && menus.length > 1 && (
                      <span className="ml-2 text-[1rem] uppercase">
                        {t("now")}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {activeMenu?.sections.map((section) => (
              <div key={section.sectionId} className="pt-8">
                <h2 className="font-primary font-medium text-[1.8rem] leading-10 text-black pb-2">
                  {section.name}
                </h2>
                {section.description && (
                  <p className="text-[1.3rem] text-neutral-600 pb-4">
                    {section.description}
                  </p>
                )}

                <ul className="flex flex-col divide-y divide-neutral-100">
                  {section.items.map((item) => (
                    <li
                      key={item.itemId}
                      // Out of stock is greyed, never hidden: hiding it makes a
                      // guest think the venue stopped serving it entirely.
                      className={`flex items-start gap-4 py-5 ${
                        item.isAvailable ? "" : "opacity-45"
                      }`}
                    >
                      {item.imageUrl && (
                        <ImageLightbox
                          src={item.imageUrl}
                          alt={item.name}
                          triggerClassName="w-24 h-24 rounded-2xl overflow-hidden shrink-0 cursor-zoom-in block"
                        />
                      )}
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <div className="flex items-baseline justify-between gap-4">
                          <span className="text-[1.5rem] font-medium leading-8 text-deep-100">
                            {item.name}
                          </span>
                          <span className="text-[1.5rem] font-medium leading-8 text-primary-500 shrink-0">
                            {formatPrice(
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
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {!item.isAvailable && (
                            <span className="text-[1.1rem] font-bold uppercase text-neutral-500">
                              {t("unavailable")}
                            </span>
                          )}
                          {item.dietaryTags?.map((tag) => (
                            <span
                              key={tag}
                              className="text-[1.1rem] px-2 py-[0.2rem] rounded-[30px] bg-neutral-100 text-neutral-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {/* Full week */}
        {!restaurant.alwaysOpen && restaurant.hours?.length > 0 && (
          <section className="pt-12">
            <h2 className="font-primary font-medium text-[1.8rem] leading-10 text-black pb-4">
              {t("hours")}
            </h2>
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
                    <span className="text-[1.4rem] text-deep-100">
                      {row
                        ? `${trimSeconds(row.opensAt)} - ${trimSeconds(row.closesAt)}`
                        : t("closed")}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Gallery */}
        {restaurant.images && restaurant.images.length > 0 && (
          <section className="pt-12">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {restaurant.images.map((image) => (
                <ImageLightbox
                  key={image.imageId}
                  src={image.imageUrl}
                  alt={image.caption ?? restaurant.name}
                  triggerClassName="w-full h-40 rounded-2xl overflow-hidden cursor-zoom-in block"
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
