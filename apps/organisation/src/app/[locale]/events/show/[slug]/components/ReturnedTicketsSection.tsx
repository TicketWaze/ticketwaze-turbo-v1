"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Money3 } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Event, TicketReturn } from "@ticketwaze/typescript-config";
import FormatDate from "@/lib/FormatDate";
import { ButtonAccent } from "@/components/shared/buttons";

export default function ReturnedTicketsSection({
  event,
  ticketReturns,
}: {
  event: Event;
  ticketReturns: TicketReturn[];
}) {
  const t = useTranslations("Events.single_event.ticket_returns");
  const locale = useLocale();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const shouldShow =
    ticketReturns.length > 0 ||
    event.deletionStatus === "deleted" ||
    event.deletionStatus === "pending_deletion";

  if (!shouldShow) return null;

  const selected = ticketReturns.find((tr) => tr.ticketReturnId === selectedId) ?? null;
  const timezone = event.eventDays[0].timezone;

  return (
    <div className="flex flex-col gap-6 pt-4">
      <div className="flex items-center gap-4">
        <h2 className="font-medium font-primary text-[2rem] leading-10 text-deep-100">
          {t("title")}
        </h2>
        <span className="px-4 py-[3px] rounded-[30px] bg-neutral-100 text-[1.2rem] font-medium leading-6 text-neutral-600">
          {ticketReturns.length} {t("badge_suffix")}
        </span>
      </div>

      {ticketReturns.length === 0 ? (
        <EmptyState message={t("empty")} />
      ) : (
        <Drawer
          direction="right"
          open={selectedId !== null}
          onOpenChange={(open) => { if (!open) setSelectedId(null); }}
        >
          <Table className="mt-2">
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
                  {t("table.ticket_id")}
                </TableHead>
                <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
                  {t("table.full_name")}
                </TableHead>
                <TableHead className="hidden lg:table-cell font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
                  {t("table.ticket_type")}
                </TableHead>
                <TableHead className="hidden lg:table-cell font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
                  {t("table.amount_paid")}
                </TableHead>
                <TableHead className="hidden lg:table-cell font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
                  {t("table.reason")}
                </TableHead>
                <TableHead className="hidden lg:table-cell font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
                  {t("table.return_date")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ticketReturns.map((tr) => {
                const displayName =
                  (tr.fullName ??
                    `${tr.firstName ?? ""} ${tr.lastName ?? ""}`.trim()) ||
                  "—";
                return (
                  <TableRow
                    key={tr.ticketReturnId}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(tr.ticketReturnId)}
                  >
                    <TableCell className="text-[1.5rem] py-[15px] leading-8 text-neutral-900">
                      {tr.ticketName}
                    </TableCell>
                    <TableCell className="text-[1.5rem] leading-8 text-neutral-900">
                      {displayName}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="py-[3px] text-[1.1rem] font-bold leading-6 uppercase text-[#EF1870] px-[5px] rounded-[30px] bg-[#f5f5f5]">
                        {tr.ticketType}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-[1.5rem] font-medium leading-8 text-neutral-900">
                      {event.currency === "USD"
                        ? tr.ticketUsdPrice
                        : tr.ticketPrice}{" "}
                      {event.currency}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span
                        className={`py-[3px] text-[1.1rem] font-bold leading-6 uppercase px-[5px] rounded-[30px] bg-[#f5f5f5] ${
                          tr.reason === "EVENT_CANCELLED"
                            ? "text-[#EA961C]"
                            : "text-neutral-500"
                        }`}
                      >
                        {tr.reason === "USER_INITIATED"
                          ? t("reason.user_initiated")
                          : t("reason.event_cancelled")}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900">
                      {FormatDate(tr.createdAt, locale, timezone)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {selected && (
            <DrawerContent className="my-6 p-12 rounded-[30px] w-full lg:w-[580px]">
              <div className="w-full flex flex-col items-center overflow-y-scroll">
                <DrawerTitle className="pb-16">
                  <span className="font-primary font-medium text-center text-[2.6rem] leading-12 text-black">
                    {t("drawer_title")}
                  </span>
                </DrawerTitle>
                <DrawerDescription asChild className="w-full">
                  <div className="w-full flex flex-col gap-0">
                    <Section>
                      <Row label={t("table.full_name")}>
                        {(selected.fullName ??
                          `${selected.firstName ?? ""} ${selected.lastName ?? ""}`.trim()) || "—"}
                      </Row>
                      <Row label={t("table.email")}>{selected.email ?? "—"}</Row>
                    </Section>

                    <DrawerSeparator />

                    <Section>
                      <Row label={t("table.ticket_id")}>
                        <span className="text-primary-500 font-bold">
                          {selected.ticketName}
                        </span>
                      </Row>
                      <Row label={t("table.ticket_type")}>
                        <span
                          className={`py-[3px] px-[5px] text-[1.1rem] font-bold uppercase rounded-[30px] bg-[#f5f5f5]
                            ${selected.ticketType.toUpperCase() === "GENERAL" ? "text-[#EF1870]" : ""}
                            ${selected.ticketType.toUpperCase() === "VIP" ? "text-[#7A19C7]" : ""}
                            ${selected.ticketType.toUpperCase() === "VVIP" ? "text-deep-100" : ""}
                          `}
                        >
                          {selected.ticketType.toUpperCase()}
                        </span>
                      </Row>
                    </Section>

                    <DrawerSeparator />

                    <Section>
                      <Row label={t("table.amount_paid")}>
                        <div className="flex flex-col items-end gap-[2px]">
                          <span>{selected.ticketPrice} HTG</span>
                          <span className="text-[1.2rem] font-normal text-neutral-500">
                            {selected.ticketUsdPrice} USD
                          </span>
                        </div>
                      </Row>
                      <Row label={t("table.refunded")}>
                        <div className="flex flex-col items-end gap-[2px]">
                          <span>{selected.ticketPrice} HTG</span>
                          <span className="text-[1.2rem] font-normal text-neutral-500">
                            {selected.ticketUsdPrice} USD
                          </span>
                        </div>
                      </Row>
                    </Section>

                    <DrawerSeparator />

                    <Section>
                      <Row label={t("table.reason")}>
                        <span
                          className={`py-[3px] text-[1.1rem] font-bold uppercase px-[5px] rounded-[30px] bg-[#f5f5f5] ${
                            selected.reason === "EVENT_CANCELLED"
                              ? "text-[#EA961C]"
                              : "text-neutral-500"
                          }`}
                        >
                          {selected.reason === "USER_INITIATED"
                            ? t("reason.user_initiated")
                            : t("reason.event_cancelled")}
                        </span>
                      </Row>
                      <Row label={t("table.was_checked")}>
                        <span
                          className={`py-[3px] text-[1.1rem] font-bold uppercase px-[5px] rounded-[30px] bg-[#f5f5f5] ${
                            selected.originalStatus === "CHECKED"
                              ? "text-[#349C2E]"
                              : "text-neutral-400"
                          }`}
                        >
                          {selected.originalStatus === "CHECKED"
                            ? t("checked.yes")
                            : t("checked.no")}
                        </span>
                      </Row>
                      <Row label={t("table.return_date")}>
                        {FormatDate(selected.createdAt, locale, timezone)}
                      </Row>
                    </Section>
                  </div>
                </DrawerDescription>
              </div>

              <DrawerFooter>
                <DrawerClose asChild className="cursor-pointer">
                  <ButtonAccent className="w-full">{t("close")}</ButtonAccent>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          )}
        </Drawer>
      )}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <p className="flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600">
      {label}
      <span className="text-deep-100 font-medium leading-8 text-right max-w-[60%]">
        {children}
      </span>
    </p>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <div className="w-full flex flex-col gap-8">{children}</div>;
}

function DrawerSeparator() {
  return (
    <div className="w-full py-6">
      <div className="bg-neutral-200 w-full h-[.2rem]" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="w-[330px] lg:w-[460px] mx-auto flex flex-col items-center mt-8 gap-[5rem]">
      <div className="w-[120px] h-[120px] rounded-full flex items-center justify-center bg-neutral-100">
        <div className="w-[90px] h-[90px] rounded-full flex items-center justify-center bg-neutral-200">
          <Money3 size="50" color="#0d0d0d" variant="Bulk" />
        </div>
      </div>
      <div className="flex flex-col gap-12 items-center text-center">
        <p className="text-[1.8rem] leading-[25px] text-neutral-600 max-w-[330px] lg:max-w-[422px]">
          {message}
        </p>
      </div>
    </div>
  );
}
