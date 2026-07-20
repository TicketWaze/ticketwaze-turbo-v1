import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import PageLoader from "@/components/PageLoader";

/**
 * Stripe's return page for a reservation.
 *
 * No auth header: a guest can book without an account, and the settle call is
 * authorised by possession of the Stripe session id, not by a token. The API is
 * idempotent on that id, so a refresh here cannot charge or confirm twice.
 */
export default async function SuccessReservationStripe({
  searchParams,
}: {
  searchParams: Promise<{ session_id: string | undefined }>;
}) {
  const { session_id } = await searchParams;
  const locale = await getLocale();

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/reservations/stripe/finish/${session_id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": locale,
        origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
      },
    },
  ).catch(() => null);
  const response = request ? await request.json().catch(() => null) : null;

  if (response?.status === "success" && response.reservation?.reservationCode) {
    redirect({
      href: `/explore/reservations/${response.reservation.reservationCode}`,
      locale,
    });
  } else {
    redirect({ href: `/explore`, locale });
  }

  return (
    <AttendeeLayout className="items-center justify-center" title="">
      <PageLoader isLoading={true} />
    </AttendeeLayout>
  );
}
