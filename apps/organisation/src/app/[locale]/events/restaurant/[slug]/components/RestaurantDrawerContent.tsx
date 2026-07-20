/* eslint-disable @next/next/no-img-element */
"use client";
import { Restaurant } from "@ticketwaze/typescript-config";
import {
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Clock, Edit2, Location } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { formatMoney } from "@ticketwaze/currency";
import { LinkPrimary } from "@/components/shared/Links";
import { slugify } from "@/lib/Slugify";

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function trimSeconds(time: string) {
  return time.slice(0, 5);
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-neutral-100 py-3 last:border-0">
      <span className="text-[1.4rem] text-neutral-600">{label}</span>
      <span className="text-[1.5rem] leading-8 text-deep-100 text-right">
        {value}
      </span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full flex flex-col gap-[1.5rem] justify-start">
      <span className="font-primary text-deep-100 font-medium text-[1.8rem]">
        {title}
      </span>
      {children}
    </div>
  );
}

export default function RestaurantDrawerContent({
  restaurant,
}: {
  restaurant: Restaurant;
}) {
  const t = useTranslations("Events.restaurantDetail");
  const tf = useTranslations("Events.create_event.restaurant");
  const tc = useTranslations("Events.restaurantCard");
  const locale = useLocale();

  const hoursByDay = new Map(restaurant.hours?.map((h) => [h.dayOfWeek, h]));

  return (
    <DrawerContent className={"my-6 p-6 lg:p-12 rounded-[30px] lg:w-[580px]"}>
      <div className={"w-full flex flex-col items-center overflow-y-scroll"}>
        <DrawerTitle className={"pb-[40px]"}>
          <span className="font-primary font-medium text-center text-[2.6rem] leading-[30px] text-black">
            {t("info_title")}
          </span>
        </DrawerTitle>
        <DrawerDescription className="sr-only">
          Restaurant details
        </DrawerDescription>

        <div className={"w-full"}>
          <div className={"w-full gap-[30px] flex flex-col"}>
            {restaurant.coverImageUrl && (
              <Image
                alt={restaurant.name}
                src={restaurant.coverImageUrl}
                height={298}
                width={520}
                className={"rounded-[10px] h-[298px] w-full object-cover object-top"}
              />
            )}

            <Section title={t("description")}>
              <div
                className="rich-text text-[1.5rem] leading-8 text-neutral-700"
                dangerouslySetInnerHTML={{ __html: restaurant.description }}
              />
            </Section>

            {restaurant.images && restaurant.images.length > 0 && (
              <Section title={tf("gallery")}>
                <div className="grid grid-cols-3 gap-3">
                  {restaurant.images.map((image) => (
                    <img
                      key={image.imageId}
                      src={image.imageUrl}
                      alt={image.caption ?? restaurant.name}
                      className="w-full h-32 object-cover rounded-[10px]"
                    />
                  ))}
                </div>
              </Section>
            )}

            <Section title={t("hours")}>
              {restaurant.alwaysOpen ? (
                <div className="flex items-center gap-[5px]">
                  <Clock size="18" color="#737c8a" variant="Bulk" />
                  <span className="text-[1.5rem] leading-8 text-deep-100">
                    {t("always_open")}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col">
                  {DAY_ORDER.map((day) => {
                    const row = hoursByDay.get(day);
                    // A day with no row is closed — absence is the state.
                    return (
                      <Row
                        key={day}
                        label={tf(`days.${day}`)}
                        value={
                          row
                            ? `${trimSeconds(row.opensAt)} - ${trimSeconds(row.closesAt)}`
                            : t("closed")
                        }
                      />
                    );
                  })}
                </div>
              )}
            </Section>

            <Section title={t("services")}>
              <div className="flex flex-col">
                <Row
                  label={tc("reservations")}
                  value={
                    restaurant.acceptsReservations
                      ? t("reservations_on")
                      : t("reservations_off")
                  }
                />
                {restaurant.acceptsReservations && (
                  <>
                    <Row
                      label={t("fee")}
                      value={formatMoney(
                        restaurant.reservationFee,
                        restaurant.reservationFeeCurrency,
                        locale,
                      )}
                    />
                    <Row
                      label={t("seats_per_slot")}
                      value={String(restaurant.maxCoversPerSlot)}
                    />
                  </>
                )}
                <Row
                  label={tf("accepts_online_payment")}
                  value={
                    restaurant.acceptsOnlinePayment
                      ? t("payment_on")
                      : t("payment_off")
                  }
                />
                <Row
                  label={tc("delivery")}
                  value={
                    restaurant.offersDelivery
                      ? (restaurant.deliveryPhone ?? "-")
                      : t("reservations_off")
                  }
                />
              </div>
            </Section>

            <Section title={t("contact")}>
              <div className="flex items-center gap-[5px]">
                <Location size="18" color="#737c8a" variant="Bulk" />
                <span className="text-[1.5rem] leading-8 text-deep-100">
                  {restaurant.address}, {restaurant.city}
                </span>
              </div>
              <div className="flex flex-col">
                {restaurant.phone && (
                  <Row label={tf("phone")} value={restaurant.phone} />
                )}
                {restaurant.whatsapp && (
                  <Row label={tf("whatsapp")} value={restaurant.whatsapp} />
                )}
                {restaurant.email && (
                  <Row label={tf("email")} value={restaurant.email} />
                )}
                {restaurant.website && (
                  <Row label={tf("website")} value={restaurant.website} />
                )}
                <Row label={tf("type")} value={restaurant.establishmentType} />
                {restaurant.cuisineTypes?.length > 0 && (
                  <Row
                    label={tf("cuisine")}
                    value={restaurant.cuisineTypes.join(", ")}
                  />
                )}
              </div>
            </Section>
          </div>
        </div>
      </div>

      <DrawerFooter className="px-0">
        <LinkPrimary
          className="gap-4 items-center"
          href={`/events/restaurant/${slugify(restaurant.name, restaurant.restaurantId)}/edit`}
        >
          <Edit2 size="20" color="#fff" variant="Bulk" />
          {t("edit")}
        </LinkPrimary>
      </DrawerFooter>
    </DrawerContent>
  );
}
