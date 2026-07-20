"use client";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Restaurant } from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Location } from "iconsax-reactjs";
import { RestaurantStatusDialog, StatusBadge } from "./RestaurantStatusDialog";
import { RestaurantSuspensionDialog } from "./RestaurantSuspensionDialog";

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_NAMES: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

function trimSeconds(time: string) {
  return time.slice(0, 5);
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-neutral-100 py-4 last:border-0">
      <span className="text-[1.4rem] font-medium text-neutral-600">
        {label}
      </span>
      <span className="text-[1.5rem] leading-8 text-black text-right">
        {value}
      </span>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[15px] border border-neutral-100 p-6">
      <span className="font-semibold text-[1.6rem] leading-8 text-black">
        {title}
      </span>
      {children}
    </div>
  );
}

export default function RestaurantReviewComponent({
  restaurant,
  organisation,
}: {
  restaurant: Restaurant;
  organisation: {
    organisationName: string;
    profileImageUrl: string | null;
    isVerified?: boolean;
  } | null;
}) {
  const locale = useLocale();
  const router = useRouter();

  const isSuspended = restaurant.suspendedAt !== null;
  const hoursByDay = new Map(restaurant.hours?.map((h) => [h.dayOfWeek, h]));

  // Public visibility is derived from all four switches, never stored. Showing
  // the derivation stops an admin wondering why an approved venue is invisible.
  const visible =
    restaurant.adminStatus === "approved" &&
    !isSuspended &&
    restaurant.isListed &&
    !restaurant.isPermanentlyClosed;

  return (
    <div className="flex flex-col gap-12 overflow-y-scroll">
      <button
        onClick={() => router.push("/activities")}
        className="flex items-center gap-4 w-fit cursor-pointer"
      >
        <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center">
          <ArrowLeft size="20" color="#0d0d0d" variant="Bulk" />
        </div>
        <span className="text-neutral-700 text-[1.4rem] leading-8">Back</span>
      </button>

      <div className="flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <h3 className="font-medium font-primary text-[2.6rem] leading-12 text-black">
            {restaurant.name}
          </h3>
          <StatusBadge status={restaurant.adminStatus} />
          {isSuspended && (
            <span className="py-[0.3rem] px-4 text-[1.1rem] font-bold leading-6 uppercase rounded-[30px] text-[#E53935] bg-[#FCE5EA]">
              Suspended
            </span>
          )}
          {!visible && !isSuspended && (
            <span className="py-[0.3rem] px-4 text-[1.1rem] font-bold leading-6 uppercase rounded-[30px] text-neutral-600 bg-neutral-100">
              Not public
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <RestaurantStatusDialog restaurant={restaurant} />
          <RestaurantSuspensionDialog restaurant={restaurant} />
        </div>
      </div>

      {restaurant.adminStatus === "rejected" && restaurant.rejectionReason && (
        <div className="flex flex-col gap-2 rounded-[15px] border border-[#E53935]/30 bg-[#FCE5EA] p-6">
          <span className="text-[1.4rem] font-medium text-failure">
            Rejection reason
          </span>
          <p className="text-[1.4rem] leading-8 text-neutral-700">
            {restaurant.rejectionReason}
          </p>
        </div>
      )}

      {isSuspended && restaurant.suspensionReason && (
        <div className="flex flex-col gap-2 rounded-[15px] border border-[#E53935]/30 bg-[#FCE5EA] p-6">
          <span className="text-[1.4rem] font-medium text-failure">
            Suspension reason
          </span>
          <p className="text-[1.4rem] leading-8 text-neutral-700">
            {restaurant.suspensionReason}
          </p>
        </div>
      )}

      {restaurant.coverImageUrl && (
        <div className="relative w-full h-100 lg:h-140 rounded-[15px] overflow-hidden">
          <Image
            src={restaurant.coverImageUrl}
            alt={restaurant.name}
            fill
            className="object-cover object-top"
          />
        </div>
      )}

      {organisation && (
        <div className="flex items-center gap-4">
          {organisation.profileImageUrl ? (
            <Image
              src={organisation.profileImageUrl}
              width={40}
              height={40}
              alt={organisation.organisationName}
              className="rounded-full"
            />
          ) : (
            <span className="w-14 h-14 flex items-center justify-center bg-black rounded-full text-white uppercase font-medium text-[2rem] font-primary">
              {organisation.organisationName.slice(0, 1)}
            </span>
          )}
          <div className="flex flex-col">
            <span className="text-[1.5rem] text-deep-100 leading-8">
              {organisation.organisationName}
            </span>
          </div>
        </div>
      )}

      <div
        className="text-[1.5rem] leading-9 text-neutral-700"
        dangerouslySetInnerHTML={{ __html: restaurant.description }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Visibility: four independent switches, two owned by each side. */}
        <Card title="Visibility">
          <Row label="Review status" value={restaurant.adminStatus} />
          <Row label="Suspended by Ticketwaze" value={isSuspended ? "Yes" : "No"} />
          <Row
            label="Listed by organizer"
            value={restaurant.isListed ? "Yes" : "No"}
          />
          <Row
            label="Permanently closed"
            value={restaurant.isPermanentlyClosed ? "Yes" : "No"}
          />
          <Row label="Publicly visible" value={visible ? "Yes" : "No"} />
        </Card>

        <Card title="Venue">
          <Row label="Type" value={restaurant.establishmentType} />
          <Row
            label="Cuisine"
            value={
              restaurant.cuisineTypes?.length
                ? restaurant.cuisineTypes.join(", ")
                : "-"
            }
          />
          <Row label="Slug" value={restaurant.slug} />
          <Row label="Timezone" value={restaurant.timezone} />
          {restaurant.seatingCapacity != null && (
            <Row label="Seats" value={String(restaurant.seatingCapacity)} />
          )}
        </Card>

        <Card title="Services">
          <Row
            label="Reservations"
            value={restaurant.acceptsReservations ? "On" : "Off"}
          />
          {restaurant.acceptsReservations && (
            <>
              <Row
                label="Booking fee"
                value={formatMoney(
                  restaurant.reservationFee,
                  restaurant.reservationFeeCurrency,
                  locale,
                )}
              />
              <Row
                label="Seats per slot"
                value={String(restaurant.maxCoversPerSlot)}
              />
              <Row
                label="Party size"
                value={`${restaurant.minPartySize} - ${restaurant.maxPartySize}`}
              />
            </>
          )}
          <Row
            label="QR payment"
            value={restaurant.acceptsOnlinePayment ? "On" : "Off"}
          />
          <Row
            label="Delivery"
            value={restaurant.offersDelivery ? "On" : "Off"}
          />
          <Row label="Takeout" value={restaurant.offersTakeout ? "On" : "Off"} />
        </Card>

        <Card title="Contact">
          <Row label="Address" value={restaurant.address} />
          <Row
            label="City"
            value={`${restaurant.city}, ${restaurant.state}, ${restaurant.country}`}
          />
          <Row label="Phone" value={restaurant.phone ?? "-"} />
          <Row label="WhatsApp" value={restaurant.whatsapp ?? "-"} />
          <Row label="Email" value={restaurant.email ?? "-"} />
          <Row label="Website" value={restaurant.website ?? "-"} />
        </Card>
      </div>

      <div className="flex flex-col gap-2 rounded-[15px] border border-neutral-100 p-6">
        <span className="font-semibold text-[1.6rem] leading-8 text-black flex items-center gap-3">
          <Clock size="18" color="#737c8a" variant="Bulk" />
          Opening hours
        </span>
        {restaurant.alwaysOpen ? (
          <p className="text-[1.5rem] leading-8 text-black py-4">Open 24/7</p>
        ) : (
          DAY_ORDER.map((day) => {
            const row = hoursByDay.get(day);
            // A day with no row is closed — absence is the state.
            return (
              <Row
                key={day}
                label={DAY_NAMES[day]}
                value={
                  row
                    ? `${trimSeconds(row.opensAt)} - ${trimSeconds(row.closesAt)}`
                    : "Closed"
                }
              />
            );
          })
        )}
      </div>

      {restaurant.location && (
        <div className="flex items-center gap-3 text-neutral-600">
          <Location size="18" color="#737c8a" variant="Bulk" />
          <span className="text-[1.4rem]">
            {restaurant.location.lat}, {restaurant.location.lng}
          </span>
        </div>
      )}
    </div>
  );
}
