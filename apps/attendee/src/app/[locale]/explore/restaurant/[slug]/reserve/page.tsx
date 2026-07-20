import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { auth } from "@/lib/auth";
import { Restaurant } from "@ticketwaze/typescript-config";
import ReserveForm from "./ReserveForm";

/**
 * Booking starts here: pick a time, then pay. The seat is only held once a slot
 * is chosen and the form submitted, so browsing this page never blocks a table.
 */
export default async function ReservePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const session = await auth();
  const t = await getTranslations("Event.reserve");

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/explore/restaurants/${slug}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": locale,
        origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
      },
      // Only the venue record — name, hours, seat pool, fee. Safe to cache:
      // availability is fetched separately and is never cached, so a stale
      // record here cannot produce a stale slot.
      next: { revalidate: 60 },
    },
  );

  // The API omits `data` keys on error, so an unguarded read crashes the page.
  const response = await request.json().catch(() => null);
  if (!request.ok || !response?.restaurant) notFound();

  const restaurant: Restaurant = response.restaurant;
  if (!restaurant.acceptsReservations) notFound();

  // Wallet is offered as a payment method inside the flow, so its balance has to
  // be known before the payment step is reached.
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
    <AttendeeLayout title={t("page_title")}>
      <ReserveForm
        restaurant={restaurant}
        slug={slug}
        isLoggedIn={Boolean(session?.user)}
        accessToken={session?.user?.accessToken ?? ""}
        defaultName={
          session?.user
            ? `${session.user.firstName ?? ""} ${session.user.lastName ?? ""}`.trim()
            : ""
        }
        defaultEmail={session?.user?.email ?? ""}
        walletHtg={walletHtg}
        walletUsd={walletUsd}
        feeWaived={feeWaived}
      />
    </AttendeeLayout>
  );
}
