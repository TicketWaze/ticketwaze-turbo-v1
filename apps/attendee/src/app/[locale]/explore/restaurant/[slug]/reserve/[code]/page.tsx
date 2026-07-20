import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { auth } from "@/lib/auth";
import ReservationCheckout, { type HeldReservation } from "./ReservationCheckout";

/**
 * Paying for a held seat.
 *
 * Keyed on the door code rather than the reservation id: it is the one handle a
 * guest without an account can return with, which matters because the hold
 * outlives the page they were on.
 */
export default async function ReservationCheckoutPage({
  params,
}: {
  params: Promise<{ slug: string; code: string }>;
}) {
  const { slug, code } = await params;
  const locale = await getLocale();
  const session = await auth();
  const t = await getTranslations("Event.reserve");

  const headers = {
    "Content-Type": "application/json",
    "Accept-Language": locale,
    origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
  };

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/reservations/code/${code}`,
    { method: "GET", headers, cache: "no-store" },
  ).catch(() => null);

  // The API omits `data` keys on error, so an unguarded read crashes the page.
  const response = await request?.json().catch(() => null);
  if (!request?.ok || !response?.reservation) notFound();

  const reservation: HeldReservation = response.reservation;

  let walletHtg = 0;
  let walletUsd = 0;
  let feeWaived = false;
  if (session?.user?.accessToken) {
    try {
      const walletRequest = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/me/wallet`,
        {
          headers: { Authorization: `Bearer ${session.user.accessToken}` },
          cache: "no-store",
        },
      );
      const walletResponse = await walletRequest.json();
      walletHtg = Number(walletResponse?.wallet?.htgAvailableBalance) || 0;
      walletUsd = Number(walletResponse?.wallet?.usdAvailableBalance) || 0;
      feeWaived = walletResponse?.wallet?.firstPurchaseFeeWaiver === true;
    } catch {
      walletHtg = 0;
      walletUsd = 0;
      feeWaived = false;
    }
  }

  return (
    <AttendeeLayout title={t("checkout_title")}>
      <ReservationCheckout
        reservation={reservation}
        slug={slug}
        walletHtg={walletHtg}
        walletUsd={walletUsd}
        feeWaived={feeWaived}
        isLoggedIn={Boolean(session?.user?.accessToken)}
        accessToken={session?.user?.accessToken ?? ""}
      />
    </AttendeeLayout>
  );
}
