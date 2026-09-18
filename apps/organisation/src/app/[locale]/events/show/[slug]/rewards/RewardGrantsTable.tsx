"use client";
import { useLocale, useTranslations } from "next-intl";
import type { RewardGrant } from "@ticketwaze/typescript-config";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Who earned the reward, and what they were given.
 *
 * A grant taken back by a return stays listed, greyed and marked — it happened,
 * and a row vanishing from this table is how an organiser ends up believing
 * they miscounted.
 */
export default function RewardGrantsTable({
  grants,
}: {
  grants: RewardGrant[];
}) {
  const t = useTranslations("Events.single_event.rewards");
  const locale = useLocale();

  if (grants.length === 0) {
    return (
      <div className="flex items-center justify-center py-[6rem]">
        <span className="text-[1.5rem] text-neutral-600">
          {t("grants_empty")}
        </span>
      </div>
    );
  }

  const headClass =
    "font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase";
  const cellClass = "text-[1.5rem] py-[15px] leading-8 text-neutral-900";

  return (
    <Table className="mt-4">
      <TableHeader>
        <TableRow>
          <TableHead className={headClass}>{t("buyer")}</TableHead>
          <TableHead className={headClass}>{t("quantity")}</TableHead>
          <TableHead className={`hidden lg:table-cell ${headClass}`}>
            {t("tickets")}
          </TableHead>
          <TableHead className={`hidden lg:table-cell ${headClass}`}>
            {t("earned_on")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {grants.map((grant) => {
          const revoked = grant.status === "REVOKED";
          const tone = revoked ? "text-neutral-500" : "text-neutral-900";
          const holder = grant.user
            ? `${grant.user.firstName} ${grant.user.lastName}`.trim()
            : null;
          const email = grant.user?.email ?? grant.guestEmail ?? "";

          return (
            <TableRow key={grant.rewardGrantId}>
              <TableCell className={cellClass}>
                <div className="flex flex-col">
                  <span className={tone}>{holder ?? email}</span>
                  {holder && (
                    <span className="text-[1.2rem] text-neutral-600">
                      {email}
                    </span>
                  )}
                  {revoked && (
                    <span className="text-[1.1rem] text-neutral-500 uppercase tracking-[0.04em]">
                      {t("revoked")}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className={cellClass}>
                <span className={tone}>{grant.quantity}</span>
              </TableCell>
              <TableCell className={`hidden lg:table-cell ${cellClass}`}>
                <span className={tone}>
                  {(grant.tickets ?? [])
                    .map((ticket) => ticket.ticketName)
                    .join(", ") || "—"}
                </span>
              </TableCell>
              <TableCell className={`hidden lg:table-cell ${cellClass}`}>
                <span className={tone}>
                  {new Date(
                    grant.createdAt as unknown as string,
                  ).toLocaleDateString(locale, {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
