"use client";
import { useLocale, useTranslations } from "next-intl";
import { User as UserIcon } from "iconsax-reactjs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type EventReservation = {
  eventReservationId: string;
  createdAt: string;
  user: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};

/**
 * Who has reserved a place on this teaser — the coming-soon counterpart of the
 * attendee list on a selling activity. Same table treatment, so the two screens
 * read as the same product.
 */
export default function ReservationsList({
  reservations,
}: {
  reservations: EventReservation[];
}) {
  const t = useTranslations("Events.coming_soon.reservations");
  const locale = useLocale();

  const formatDate = (value: string) => {
    try {
      return new Date(value).toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return value;
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h4 className="font-medium font-primary text-[1.8rem] leading-10 text-black">
          {t("title")}
        </h4>
        <span className="text-[1.4rem] leading-8 text-neutral-600">
          {t("count", { count: reservations.length })}
        </span>
      </div>

      {reservations.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
                {t("table.name")}
              </TableHead>
              <TableHead className="font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
                {t("table.email")}
              </TableHead>
              <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
                {t("table.date")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.map((reservation) => (
              <TableRow key={reservation.eventReservationId}>
                <TableCell className="text-[1.5rem] py-6 leading-8 text-neutral-900">
                  {/* The join can come back empty if the account was removed
                      between the reservation and this read. */}
                  {reservation.user
                    ? `${reservation.user.firstName} ${reservation.user.lastName}`.trim()
                    : "—"}
                </TableCell>
                <TableCell className="text-[1.5rem] py-6 hidden lg:table-cell leading-8 text-neutral-900">
                  {reservation.user?.email ?? "—"}
                </TableCell>
                <TableCell className="text-[1.5rem] py-6 leading-8 text-neutral-900">
                  {formatDate(reservation.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="flex flex-col w-fit gap-12 items-center mt-8 self-center">
          <div className="rounded-full bg-neutral-100 p-6 w-fit">
            <div className="flex items-center rounded-full bg-neutral-200 p-8 w-fit justify-center">
              <UserIcon size={50} color="#0D0D0D" variant="Bulk" />
            </div>
          </div>
          <p className="w-172 text-[1.8rem] text-neutral-600 leading-10 text-center">
            {t("empty")}
          </p>
        </div>
      )}
    </div>
  );
}
