"use client";
import { useState } from "react";
import { useLocale } from "next-intl";
import { Restaurant } from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import { ReceiptDiscount, Status } from "iconsax-reactjs";
import { RestaurantStatusDialog, StatusBadge } from "./RestaurantStatusDialog";
import FeesHandlerDialog from "@/components/shared/FeesHandlerDialog";
import ActivityActionsMenu from "@/components/shared/ActivityActionsMenu";
import ActivityHeaderActions, {
  ActivitySuspensionNotice,
} from "@/components/shared/ActivityHeaderActions";
import ActivityDetailShell, {
  InfoGroup,
  InfoList,
  InfoRow,
  type DetailItem,
} from "@/components/shared/ActivityDetailShell";
import useAdminCan from "@/lib/useAdminCan";

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

const onOff = (value: boolean) => (value ? "On" : "Off");
const yesNo = (value: boolean) => (value ? "Yes" : "No");

/**
 * The venue page on the shared Figma activity layout (ActivityDetailShell).
 * Suspension now goes through the shared Suspend button (migration 044's
 * audited endpoint, which also emails the organisation within its budget)
 * instead of the venue-only dialog. Visibility stays four independent
 * switches, two owned by each side.
 */
export default function RestaurantReviewComponent({
  restaurant,
  organisation,
}: {
  restaurant: Restaurant;
  organisation: {
    organisationName: string;
    profileImageUrl: string | null;
    isVerified?: boolean;
    isSuspended?: boolean;
  } | null;
}) {
  const locale = useLocale();
  const canManage = useAdminCan("activity.manage");
  const [dialog, setDialog] = useState<null | "status" | "fees">(null);
  const control = (kind: "status" | "fees") => ({
    hideTrigger: true,
    open: dialog === kind,
    onOpenChange: (next: boolean) => setDialog(next ? kind : null),
  });

  const isSuspended = restaurant.suspendedAt !== null;
  const hoursByDay = new Map(restaurant.hours?.map((h) => [h.dayOfWeek, h]));
  const visible =
    restaurant.adminStatus === "approved" &&
    !isSuspended &&
    restaurant.isListed &&
    !restaurant.isPermanentlyClosed;

  const today = hoursByDay.get(new Date().getDay());
  const details: DetailItem[] = [
    {
      icon: "location",
      text: [restaurant.address, restaurant.city, restaurant.country].filter(Boolean).join(", ") || "-",
      wide: true,
    },
    {
      icon: "clock",
      text: restaurant.alwaysOpen
        ? "Open 24/7"
        : today
          ? `Today ${trimSeconds(today.opensAt)} - ${trimSeconds(today.closesAt)}`
          : "Closed today",
    },
    ...(restaurant.phone ? [{ icon: "phone" as const, text: restaurant.phone }] : []),
  ];

  return (
    <>
      <ActivityDetailShell
        title={restaurant.name}
        badges={
          <>
            <StatusBadge status={restaurant.adminStatus} />
            {!visible && !isSuspended && (
              <span className="py-[0.3rem] px-4 text-[1.1rem] font-bold leading-6 uppercase rounded-[30px] text-neutral-600 bg-neutral-100">
                Not public
              </span>
            )}
          </>
        }
        actions={
          <ActivityHeaderActions
            kind="restaurant"
            activityId={restaurant.restaurantId}
            editHref={`/activities/restaurant/${restaurant.restaurantId}/edit`}
            editLabel="Edit venue"
            suspendedAt={restaurant.suspendedAt as unknown as string | null}
          >
            <ActivityActionsMenu
              label="Actions"
              actions={[
                {
                  key: "status",
                  label: "Change status",
                  onSelect: () => setDialog("status"),
                  icon: <Status size="20" variant="Bulk" color="#2E3237" />,
                },
                canManage && {
                  key: "fees",
                  label: "Fees",
                  onSelect: () => setDialog("fees"),
                  icon: <ReceiptDiscount size="20" variant="Bulk" color="#2E3237" />,
                },
              ]}
            />
          </ActivityHeaderActions>
        }
        notices={
          <>
            <ActivitySuspensionNotice
              suspendedAt={restaurant.suspendedAt as unknown as string | null}
              reason={restaurant.suspensionReason}
              organisationSuspended={organisation?.isSuspended === true}
            />
            {restaurant.adminStatus === "rejected" && restaurant.rejectionReason && (
              <div className="flex flex-col gap-2 rounded-[15px] border border-failure/30 bg-[#FCE5EA] p-6">
                <span className="text-[1.4rem] font-medium text-failure">Rejection reason</span>
                <p className="text-[1.4rem] leading-8 text-neutral-700">{restaurant.rejectionReason}</p>
              </div>
            )}
          </>
        }
        imageUrl={restaurant.coverImageUrl}
        aboutTitle="About venue"
        aboutHtml={restaurant.description}
        organisation={
          organisation ? { ...organisation, organisationId: restaurant.organisationId } : null
        }
        details={details}
        tabs={[
          {
            value: "overview",
            label: "Venue overview",
            content: (
              <>
                <InfoList>
                  <InfoRow label="Publicly visible">{yesNo(visible)}</InfoRow>
                  <InfoRow label="Review status">{restaurant.adminStatus}</InfoRow>
                  <InfoRow label="Suspended by Ticketwaze">{yesNo(isSuspended)}</InfoRow>
                  <InfoRow label="Listed by organizer">{yesNo(restaurant.isListed)}</InfoRow>
                  <InfoRow label="Permanently closed">{yesNo(restaurant.isPermanentlyClosed)}</InfoRow>
                </InfoList>
                <InfoGroup title="Venue">
                  <InfoRow label="Type">{restaurant.establishmentType}</InfoRow>
                  <InfoRow label="Cuisine">
                    {restaurant.cuisineTypes?.length ? restaurant.cuisineTypes.join(", ") : "-"}
                  </InfoRow>
                  <InfoRow label="Slug">{restaurant.slug}</InfoRow>
                  <InfoRow label="Timezone">{restaurant.timezone}</InfoRow>
                  {restaurant.seatingCapacity != null && (
                    <InfoRow label="Seats">{String(restaurant.seatingCapacity)}</InfoRow>
                  )}
                </InfoGroup>
                <InfoGroup title="Services">
                  <InfoRow label="Reservations">{onOff(restaurant.acceptsReservations)}</InfoRow>
                  {restaurant.acceptsReservations && (
                    <>
                      <InfoRow label="Booking fee">
                        {formatMoney(restaurant.reservationFee, restaurant.reservationFeeCurrency, locale)}
                      </InfoRow>
                      <InfoRow label="Seats per slot">{String(restaurant.maxCoversPerSlot)}</InfoRow>
                      <InfoRow label="Party size">
                        {`${restaurant.minPartySize} - ${restaurant.maxPartySize}`}
                      </InfoRow>
                    </>
                  )}
                  <InfoRow label="QR payment">{onOff(restaurant.acceptsOnlinePayment)}</InfoRow>
                  <InfoRow label="Delivery">{onOff(restaurant.offersDelivery)}</InfoRow>
                  <InfoRow label="Takeout">{onOff(restaurant.offersTakeout)}</InfoRow>
                </InfoGroup>
              </>
            ),
          },
          {
            value: "hours",
            label: "Hours & contact",
            content: (
              <>
                <InfoList>
                  {restaurant.alwaysOpen ? (
                    <InfoRow label="Opening hours">Open 24/7</InfoRow>
                  ) : (
                    DAY_ORDER.map((day) => {
                      const row = hoursByDay.get(day);
                      return (
                        <InfoRow key={day} label={DAY_NAMES[day]}>
                          {row ? `${trimSeconds(row.opensAt)} - ${trimSeconds(row.closesAt)}` : "Closed"}
                        </InfoRow>
                      );
                    })
                  )}
                </InfoList>
                <InfoGroup title="Contact">
                  <InfoRow label="Address">{restaurant.address}</InfoRow>
                  <InfoRow label="City">
                    {`${restaurant.city}, ${restaurant.state}, ${restaurant.country}`}
                  </InfoRow>
                  <InfoRow label="Phone">{restaurant.phone ?? "-"}</InfoRow>
                  <InfoRow label="WhatsApp">{restaurant.whatsapp ?? "-"}</InfoRow>
                  <InfoRow label="Email">{restaurant.email ?? "-"}</InfoRow>
                  <InfoRow label="Website">{restaurant.website ?? "-"}</InfoRow>
                  {restaurant.location && (
                    <InfoRow label="Map pin">
                      {`${restaurant.location.lat}, ${restaurant.location.lng}`}
                    </InfoRow>
                  )}
                </InfoGroup>
              </>
            ),
          },
        ]}
      />

      <RestaurantStatusDialog restaurant={restaurant} {...control("status")} />
      <FeesHandlerDialog kind="restaurant" activityId={restaurant.restaurantId} {...control("fees")} />
    </>
  );
}
