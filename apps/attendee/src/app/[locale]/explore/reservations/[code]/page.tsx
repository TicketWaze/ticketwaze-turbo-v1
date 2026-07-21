import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { formatMoney } from "@ticketwaze/currency";
import { DocumentDownload, TickCircle } from "iconsax-reactjs";
import type { HeldReservation } from "../../restaurant/[slug]/reserve/[code]/ReservationCheckout";

/**
 * A confirmed booking, reachable by its door code alone.
 *
 * Deliberately unauthenticated: a guest who booked without an account still
 * needs somewhere to see and show their reservation. The code is the unguessable
 * secret, which is the same trade the venue makes by printing it on a QR.
 */
export default async function ReservationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const locale = await getLocale();
  const t = await getTranslations("Event.reserve");

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/reservations/code/${code}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": locale,
        origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
      },
      cache: "no-store",
    },
  ).catch(() => null);

  // The API omits `data` keys on error, so an unguarded read crashes the page.
  const response = await request?.json().catch(() => null);
  if (!request?.ok || !response?.reservation) notFound();

  const reservation: HeldReservation = response.reservation;
  const when = new Date(reservation.reservedFor).toLocaleString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  const confirmed =
    reservation.status === "confirmed" || reservation.status === "seated";

  return (
    <AttendeeLayout title={t("confirmation_title")}>
      <div className="flex flex-col gap-10 py-8 w-full max-w-[520px] mx-auto">
        {confirmed && (
          <div className="flex flex-col items-center gap-6 py-8">
            <TickCircle size="64" color="#12B76A" variant="Bulk" />
            <h1 className="text-[2.6rem] font-medium leading-12 text-black font-primary text-center">
              {t("confirmed_heading")}
            </h1>
          </div>
        )}

        <div className="p-8 rounded-[15px] border border-neutral-100 flex flex-col gap-6">
          <Row label={t("code_label")} value={reservation.reservationCode} big />
          <Row
            label={t("restaurant_label")}
            value={reservation.restaurant?.name ?? "—"}
          />
          <Row label={t("when_label")} value={when} />
          <Row
            label={t("party_label")}
            value={t("guests", { count: reservation.partySize })}
          />
          <Row label={t("name_label")} value={reservation.guestName} />
          <Row
            label={t("fee_label")}
            value={formatMoney(
              reservation.currency === "USD"
                ? reservation.usdFee
                : reservation.fee,
              reservation.currency,
              locale,
            )}
          />
          <Row
            label={t("status_label")}
            value={t(`status.${reservation.status}`)}
          />
        </div>

        {/* Plain anchor, not next-intl Link: this points at the API, and the
            response is an attachment rather than a route. */}
        {confirmed && (
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/reservations/code/${reservation.reservationCode}/ticket?locale=${locale}`}
            className="px-12 py-[1.2rem] bg-primary-500 border-2 border-transparent rounded-[100px] text-center text-white font-medium text-[1.5rem] leading-8 cursor-pointer hover:border-primary-600 transition-all duration-400 flex items-center justify-center gap-3"
          >
            <DocumentDownload size="20" color="#ffffff" variant="Bulk" />
            {t("download_ticket")}
          </a>
        )}

        <p className="text-[1.4rem] leading-8 text-neutral-600">
          {t("show_code_hint")}
        </p>
      </div>
    </AttendeeLayout>
  );
}

function Row({
  label,
  value,
  big = false,
}: {
  label: string;
  value: string;
  big?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="text-[1.4rem] text-neutral-600">{label}</span>
      <span
        className={`font-medium text-deep-100 text-right ${
          big ? "text-[2.2rem] tracking-widest" : "text-[1.5rem]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
