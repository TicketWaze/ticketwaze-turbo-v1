"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DateTime } from "luxon";
import { Award } from "iconsax-reactjs";
import { Raffle } from "@ticketwaze/typescript-config";
import FormatDate from "@/lib/FormatDate";
import TopBar from "@/components/shared/TopBar";
import RaffleMoreComponent from "./components/RaffleMoreComponent";
import RaffleDeletionBanner from "./components/RaffleDeletionBanner";

type Participant = {
  ticketName: string;
  fullName: string;
  email: string;
  createdAt: string;
};

export default function RafflePageDetails({
  raffle,
  entriesSold,
  revenue,
  participants,
}: {
  raffle: Raffle;
  entriesSold: number;
  revenue: number;
  participants: Participant[];
}) {
  const t = useTranslations("Raffles.single_raffle");
  const locale = useLocale();

  const drawDate = DateTime.fromISO(raffle.drawAt);
  const daysToDraw = Math.max(
    0,
    Math.ceil(drawDate.diff(DateTime.now(), "days").days),
  );

  const [deletionStatus, setDeletionStatus] = useState(
    raffle.deletionStatus ?? null,
  );
  const [deletionReason, setDeletionReason] = useState(
    raffle.deletionReason ?? null,
  );
  const [scheduledDeletionAt, setScheduledDeletionAt] = useState(
    raffle.scheduledDeletionAt ?? null,
  );
  const isPendingDeletion = deletionStatus === "pending_deletion";

  const moreProps = {
    raffle,
    daysLeft: daysToDraw,
    deletionStatus,
    onDeletionScheduled: (scheduledAt: string, reason: string) => {
      setDeletionStatus("pending_deletion");
      setScheduledDeletionAt(scheduledAt);
      setDeletionReason(reason);
    },
  };

  return (
    <div className={"flex flex-col gap-12 overflow-y-scroll"}>
      <TopBar title={raffle.title}>
        <div className="hidden lg:flex items-center gap-4">
          <RaffleMoreComponent {...moreProps} />
        </div>
      </TopBar>

      {/* count details */}
      <ul
        className={
          "grid grid-cols-2 lg:grid-cols-4 divide-x divide-y divide-neutral-100 border-neutral-100 border-b"
        }
      >
        <li className={"pb-12"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("stats.revenue")}
          </span>
          <p className={"font-medium text-[25px] leading-12 font-primary"}>
            {revenue}{" "}
            <span
              className={
                "font-normal text-[1.6rem] lg:text-[25px] text-neutral-500"
              }
            >
              USD
            </span>
          </p>
        </li>
        <li className={"pl-10 pb-12"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("stats.sold")}
          </span>
          <p className={"font-medium text-[25px] leading-12 font-primary"}>
            {entriesSold}{" "}
            <span className={"font-normal text-[20px] text-neutral-500"}>
              {raffle.totalTicketsLimit !== null
                ? `/ ${raffle.totalTicketsLimit}`
                : `/ ${t("stats.unlimited")}`}
            </span>
          </p>
        </li>
        <li className={"pt-8 lg:pt-0 lg:pl-10 pb-12"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("stats.prizes")}
          </span>
          <p className={"font-medium text-[25px] leading-12 font-primary"}>
            {raffle.prizes.length}
          </p>
        </li>
        <li className={"pt-8 lg:pt-0 lg:pl-10 pb-12"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("countDown")}
          </span>
          <p className={"font-medium text-[25px] leading-12 font-primary"}>
            {daysToDraw}
            <span className={"font-normal text-[20px] text-neutral-500"}>
              {" "}
              {t("day")}
            </span>
          </p>
        </li>
      </ul>

      {/* deletion banners */}
      {isPendingDeletion && scheduledDeletionAt && (
        <RaffleDeletionBanner
          organisationId={raffle.organisationId}
          raffleId={raffle.raffleId}
          scheduledDeletionAt={scheduledDeletionAt}
          deletionReason={deletionReason}
          onCancelled={() => {
            setDeletionStatus(null);
            setScheduledDeletionAt(null);
            setDeletionReason(null);
          }}
        />
      )}
      {deletionStatus === "deleted" && (
        <div className="flex items-start gap-4 rounded-[15px] border border-neutral-200 bg-neutral-50 p-6">
          <div className="w-[0.8rem] h-[0.8rem] rounded-full bg-neutral-400 mt-[0.6rem] shrink-0" />
          <p className="text-[1.5rem] leading-8 text-neutral-600">
            {t("deletion.pending_notice")}
          </p>
        </div>
      )}

      {/* review / rejection banner */}
      {!isPendingDeletion &&
        (raffle.adminStatus === "requested" ||
          raffle.adminStatus === "review") && (
        <div className="flex items-start gap-4 rounded-[15px] border border-neutral-200 bg-neutral-50 p-6">
          <div className="w-[0.8rem] h-[0.8rem] rounded-full bg-neutral-400 mt-[0.6rem] shrink-0" />
          <p className="text-[1.5rem] leading-8 text-neutral-600">
            {t("pendingReview")}
          </p>
        </div>
      )}
      {raffle.adminStatus === "rejected" && (
        <div className="flex items-start gap-4 rounded-[15px] border border-failure/30 bg-[#FCE5EA] p-6">
          <div className="w-[0.8rem] h-[0.8rem] rounded-full bg-failure mt-[0.6rem] shrink-0" />
          <p className="text-[1.5rem] leading-8 text-neutral-700">
            {t("rejected")}
            {raffle.rejectionReason ? ` — ${raffle.rejectionReason}` : ""}
          </p>
        </div>
      )}

      {/* mobile actions */}
      <div className="flex lg:hidden items-center w-full gap-8 justify-end">
        <RaffleMoreComponent {...moreProps} />
      </div>

      {/* prizes */}
      <div className="flex flex-col gap-4">
        <div className="w-full flex items-center justify-between">
          <span className="font-primary text-deep-100 font-medium text-[1.8rem] inline-flex items-center gap-2">
            <Award size="22" color="#0d0d0d" variant="Bulk" />
            {t("prizes.title")}
          </span>
        </div>
        <ul className="flex items-center gap-6 overflow-x-auto scroll-smooth scrollbar-hide py-2">
          {[...raffle.prizes]
            .sort((a, b) => a.rank - b.rank)
            .map((prize) => (
              <li
                key={prize.rafflePrizeId}
                className="flex items-start gap-4 rounded-[15px] border border-neutral-100 p-6 min-w-[28rem] flex-shrink-0"
              >
                <span className="shrink-0 w-12 h-12 rounded-full bg-primary-50 text-primary-500 font-bold flex items-center justify-center text-[1.4rem]">
                  {prize.rank}
                </span>
                <div className="flex flex-col gap-1">
                  <p className="text-[1.6rem] font-medium leading-8 text-deep-100">
                    {prize.title}
                  </p>
                  <p className="text-[1.3rem] leading-6 text-neutral-600">
                    {prize.description || t("prizes.noDescription")}
                  </p>
                </div>
              </li>
            ))}
        </ul>
      </div>

      {/* entries table */}
      <div className="w-full h-full">
        <Table className={"mt-4"}>
          <TableHeader>
            <TableRow>
              <TableHead
                className={
                  "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                }
              >
                {t("table.id")}
              </TableHead>
              <TableHead
                className={
                  "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                }
              >
                {t("table.name")}
              </TableHead>
              <TableHead
                className={
                  "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                }
              >
                {t("table.email")}
              </TableHead>
              <TableHead
                className={
                  "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                }
              >
                {t("table.date")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.map((entry) => (
              <TableRow key={entry.ticketName}>
                <TableCell
                  className={
                    "text-[1.5rem] py-6 hidden lg:table-cell leading-8 text-neutral-900"
                  }
                >
                  {entry.ticketName}
                </TableCell>
                <TableCell
                  className={"text-[1.5rem] py-6 leading-8 text-neutral-900"}
                >
                  {entry.fullName}
                </TableCell>
                <TableCell
                  className={
                    "text-[1.5rem] py-6 hidden lg:table-cell leading-8 text-neutral-900"
                  }
                >
                  {entry.email}
                </TableCell>
                <TableCell
                  className={
                    "text-[1.5rem] py-6 hidden lg:table-cell leading-8 text-neutral-900"
                  }
                >
                  {FormatDate(entry.createdAt, locale, "local")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {participants.length === 0 && (
          <p className="text-center text-[1.5rem] text-neutral-500 leading-10 py-12">
            {t("table.noEntries")}
          </p>
        )}
      </div>
    </div>
  );
}
