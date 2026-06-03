"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Money3, SearchNormal } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import { DateTime } from "luxon";
import FormatDate from "@/lib/FormatDate";
import {
  Event,
  EventPerformer,
  MembershipTier,
  Order,
  Ticket,
  TicketReturn,
  User,
} from "@ticketwaze/typescript-config";
import MoreComponent from "./MoreComponent";
import CheckingDialog from "./CheckingDialog";
import DeletionBanner from "./DeletionBanner";
import Informations from "./Informations";
import EventArtist from "./EventArtist";
import TopBar from "@/components/shared/TopBar";
import Capitalize from "@/lib/Capitalize";
import ShareEvent from "./ShareEvent";
import ReturnedTicketsSection from "./ReturnedTicketsSection";

export default function EventPageDetails({
  event,
  tickets,
  orders,
  slug,
  user,
  eventPerformers,
  membershipTier,
  ticketReturns,
}: {
  event: Event;
  tickets: Ticket[];
  orders: Order[];
  slug: string;
  user: User;
  eventPerformers: EventPerformer[];
  membershipTier: MembershipTier;
  ticketReturns: TicketReturn[];
}) {
  const t = useTranslations("Events.single_event");
  const locale = useLocale();
  const isFree = event.eventTicketTypes[0]?.ticketTypePrice == 0;
  const sortedTicketClasses = [...event.eventTicketTypes].sort((a, b) => {
    return a.ticketTypeName.localeCompare(b.ticketTypeName);
  });
  const today = DateTime.now();
  const firstDay = event.eventDays.find((d) => d.dayNumber === 1)!;
  const firstDate = DateTime.fromISO(firstDay.eventDate, { zone: "utc" })
    .setZone(firstDay.timezone, { keepLocalTime: true })
    .toISODate();
  const eventStart = DateTime.fromISO(`${firstDate}T${firstDay.startTime}`, {
    zone: firstDay.timezone,
  });
  const daysLeft = eventStart.isValid
    ? eventStart.diff(today, "days").days
    : null;
  const roundedDays = Math.ceil(daysLeft && daysLeft > 0 ? daysLeft : 0);
  const isUpcoming = eventStart.isValid && today < eventStart;

  const [deletionStatus, setDeletionStatus] = useState(
    event.deletionStatus ?? null,
  );
  const [deletionReason, setDeletionReason] = useState(
    event.deletionReason ?? null,
  );
  const [scheduledDeletionAt, setScheduledDeletionAt] = useState(
    event.scheduledDeletionAt ?? null,
  );
  const isPendingDeletion = deletionStatus === "pending_deletion";

  const [query, setQuery] = useState("");
  const filteredtickets = tickets.filter((ticket) => {
    const search = query.toLowerCase();
    return ticket.ticketName.toLowerCase().includes(search);
  });
  return (
    <div className={"flex flex-col gap-12 overflow-y-scroll"}>
      <TopBar title={event.eventName}>
        <div className="hidden lg:flex items-center gap-4">
          {isUpcoming &&
            event.adminStatus === "approved" &&
            !isPendingDeletion &&
            deletionStatus !== "deleted" && <ShareEvent event={event} />}
          {event.adminStatus === "approved" &&
            event.eventCategory !== "meet" &&
            !isPendingDeletion &&
            deletionStatus !== "deleted" && (
              <CheckingDialog event={event} user={user} />
            )}
          <MoreComponent
            daysLeft={daysLeft}
            event={event}
            isFree={isFree}
            slug={slug}
            membershipTier={membershipTier}
            deletionStatus={deletionStatus}
            onDeletionScheduled={(scheduledAt, reason) => {
              setDeletionStatus("pending_deletion");
              setScheduledDeletionAt(scheduledAt);
              setDeletionReason(reason);
            }}
          />
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
            {t("revenue")}
          </span>
          <p className={"font-medium text-[25px] leading-12 font-primary"}>
            {tickets.reduce(
              (acc, curr) =>
                acc +
                (event.currency === "USD"
                  ? curr.ticketUsdPrice
                  : curr.ticketPrice),
              0,
            )}{" "}
            <span
              className={
                "font-normal text-[1.6rem] lg:text-[25px] text-neutral-500"
              }
            >
              {event.currency}
            </span>
          </p>
        </li>
        {event.eventTicketTypes.map((t, index) => {
          const quantity = tickets.filter(
            (ticket) =>
              ticket.ticketType.toLowerCase() ===
              t.ticketTypeName.toLowerCase(),
          ).length;
          return (
            <li
              key={t.ticketTypeName}
              className={`${index % 2 === 0 ? "pl-[25px] " : "pl-0 pt-[20px] "} lg:pt-0 lg:pl-10 pb-[30px] ${index === 2 && "pt-[20px]"}`}
            >
              <span
                className={"text-[14px] text-neutral-600 leading-8 pb-[5px]"}
              >
                {Capitalize(t.ticketTypeName)}
              </span>
              <p
                className={
                  "font-medium text-[25px] leading-[30px] font-primary"
                }
              >
                {quantity}{" "}
                <span className={"font-normal text-[20px] text-neutral-500"}>
                  / {t.ticketTypeQuantity}
                </span>
              </p>
            </li>
          );
        })}
        <li
          className={`${event.eventTicketTypes.length == 1 && "py-[20px] lg:pl-[25px] lg:py-0"} `}
        >
          <span className={"text-[14px] text-neutral-600 leading-8 pb-[5px]"}>
            {t("count_down")}
          </span>
          <p className={"font-medium  text-[25px] leading-[30px] font-primary"}>
            {roundedDays}
            <span className={"font-normal text-[20px] text-neutral-500"}>
              {" "}
              {t("day")}
            </span>
          </p>
        </li>
      </ul>
      {isPendingDeletion &&
        scheduledDeletionAt &&
        deletionStatus === "pending_deletion" && (
          <DeletionBanner
            eventId={event.eventId}
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
          <div className="w-[8px] h-[8px] rounded-full bg-neutral-400 mt-[6px] shrink-0" />
          <p className="text-[1.5rem] leading-8 text-neutral-600">
            {t("deleted_notice")}
          </p>
        </div>
      )}
      <div className="flex lg:hidden items-center w-full gap-8 justify-between">
        {isUpcoming &&
        event.adminStatus === "approved" &&
        !isPendingDeletion &&
        deletionStatus !== "deleted" ? (
          <ShareEvent event={event} />
        ) : (
          <div></div>
        )}
        <MoreComponent
          daysLeft={daysLeft}
          event={event}
          isFree={isFree}
          slug={slug}
          membershipTier={membershipTier}
          deletionStatus={deletionStatus}
          onDeletionScheduled={(scheduledAt, reason) => {
            setDeletionStatus("pending_deletion");
            setScheduledDeletionAt(scheduledAt);
            setDeletionReason(reason);
          }}
        />
      </div>
      {event.eventCategory !== "meet" &&
        event.adminStatus === "approved" &&
        !isPendingDeletion &&
        deletionStatus !== "deleted" && (
          <div className="flex lg:hidden items-center w-full gap-4 justify-between">
            <CheckingDialog event={event} user={user} />
          </div>
        )}
      {isUpcoming && deletionStatus !== "deleted" && (
        <EventArtist
          event={event}
          user={user}
          eventPerformers={eventPerformers}
        />
      )}

      {/* ticket tabs details */}
      {deletionStatus !== "deleted" && (
        <Tabs defaultValue="all" className="w-full h-full ">
          <div
            className={"flex flex-col lg:flex-row gap-6 w-full justify-between"}
          >
            <TabsList
              className={`w-full order-2 lg:order-1  lg:max-w-[31.8rem] lg:w-auto mx-auto lg:mx-0 ${sortedTicketClasses.length === 1 && "hidden"}`}
            >
              <TabsTrigger value="all">All</TabsTrigger>
              {sortedTicketClasses.length > 1 &&
                sortedTicketClasses.map((ticketClass) => {
                  return (
                    <TabsTrigger
                      key={ticketClass.ticketTypeName}
                      value={ticketClass.ticketTypeName}
                    >
                      {Capitalize(ticketClass.ticketTypeName)}
                    </TabsTrigger>
                  );
                })}
            </TabsList>
            {tickets.length > 0 && (
              <div
                className={
                  "bg-neutral-100 order-1 lg:order-2 w-full rounded-[30px] flex items-center justify-between lg:w-[24.3rem] px-6 py-4"
                }
              >
                <input
                  placeholder={t("search")}
                  className={
                    "text-black font-normal text-[1.4rem] leading-8 w-full outline-none"
                  }
                  onChange={(e) => setQuery(e.target.value)}
                />
                <SearchNormal size="20" color="#737c8a" variant="Bulk" />
              </div>
            )}
          </div>
          <TabsContent value="all" className={"w-full"}>
            <Table className={"mt-4"}>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className={
                      "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
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
                    {t("table.ticket_class")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("table.amount")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("table.check")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("table.date_purchased")}
                  </TableHead>
                  {/* <TableHead
                  className={
                    'font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] w-[40px] leading-[15px] text-deep-100 uppercase'
                  }
                >
                  {single_event.table.date_purchased}
                </TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredtickets.map((ticket) => {
                  const [order] = orders.filter(
                    (order) => ticket.orderId === order.orderId,
                  );
                  return (
                    <TableRow key={ticket.ticketId}>
                      <TableCell
                        className={
                          "text-[1.5rem] py-[15px] leading-8 text-neutral-900"
                        }
                      >
                        <Drawer direction={"right"}>
                          <DrawerTrigger>
                            <span className={"cursor-pointer"}>
                              {ticket.ticketName}
                            </span>
                          </DrawerTrigger>
                          <Informations
                            event={event}
                            ticket={ticket}
                            order={order as Order}
                          />
                        </Drawer>
                      </TableCell>
                      <TableCell
                        className={"text-[1.5rem] leading-8 text-neutral-900"}
                      >
                        <Drawer direction={"right"}>
                          <DrawerTrigger>
                            <span className={"cursor-pointer"}>
                              {ticket.fullName}
                            </span>
                          </DrawerTrigger>
                          <Informations
                            event={event}
                            ticket={ticket}
                            order={order as Order}
                          />
                        </Drawer>
                      </TableCell>
                      <TableCell className={"hidden lg:table-cell"}>
                        <span
                          className={
                            "py-[3px] text-[1.1rem] font-bold leading-6 text-center uppercase text-[#EF1870]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                          }
                        >
                          {ticket.ticketType}
                        </span>
                      </TableCell>
                      <TableCell
                        className={
                          "hidden lg:table-cell text-[1.5rem] font-medium leading-8 text-neutral-900"
                        }
                      >
                        {ticket.event.currency === "USD"
                          ? ticket.ticketUsdPrice
                          : ticket.ticketPrice}{" "}
                        {event.currency}
                      </TableCell>
                      <TableCell className={"hidden lg:table-cell"}>
                        {ticket.status === "CHECKED" && (
                          <span
                            className={
                              "py-[3px] text-[1.1rem] font-bold leading-6 text-center uppercase text-[#349C2E]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                            }
                          >
                            {t("filters.checked")}
                          </span>
                        )}
                        {ticket.status === "PENDING" && (
                          <span
                            className={
                              "py-[3px] text-[1.1rem] font-bold leading-6 text-center uppercase text-[#EA961C]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                            }
                          >
                            {t("filters.pending")}
                          </span>
                        )}
                        {ticket.status === "RETURNED" && (
                          <span
                            className={
                              "py-[3px] text-[1.1rem] font-bold leading-6 text-center uppercase text-neutral-500  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                            }
                          >
                            {t("filters.returned")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell
                        className={
                          "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                        }
                      >
                        {FormatDate(
                          ticket.createdAt,
                          locale,
                          event.eventDays[0].timezone,
                        )}
                      </TableCell>
                      {/* <TableCell className={'text-[1.5rem] leading-8 text-neutral-900'}>
                        <Popover>
                          <PopoverTrigger>
                            <button
                              className={
                                'w-[35px] h-[35px] cursor-pointer rounded-full bg-neutral-100 flex items-center justify-center'
                              }
                            >
                              <MoreCircle variant={'Bulk'} size={20} color={'#737C8A'} />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            className={
                              'w-[250px] p-0 m-0 bg-none shadow-none border-none mx-4'
                            }
                          >
                            <ul
                              className={
                                'bg-neutral-100 border border-neutral-200 right-8 p-4  mb-8 rounded-[1rem] shadow-xl bottom-full flex flex-col gap-4'
                              }
                            >
                              <span
                                className={
                                  'font-medium py-[5px] border-b-[1px] border-neutral-200 text-[1.4rem] text-deep-100 leading-8'
                                }
                              >
                                {t('more')}
                              </span>
                              <div className={'flex flex-col gap-4'}>
                                <li className={''}>
                                  <Drawer direction={'right'}>
                                    <DrawerTrigger className={'w-full'}>
                                      <button
                                        className={`font-normal cursor-pointer group text-[1.5rem] py-4 border-b-[1px] border-neutral-200 leading-8 text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
                                      >
                                        <span className={''}>{t('details')}</span>
                                        <HambergerMenu
                                          size="20"
                                          variant="Bulk"
                                          color={'#2E3237'}
                                        />
                                      </button>
                                    </DrawerTrigger>
                                    <Informations />
                                  </Drawer>
                                </li>
                                <li className={''}>
                                  <button
                                    className={`font-normal group text-[1.5rem] py-4 leading-8 text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
                                  >
                                    <span className={'text-primary-500'}>
                                      {single_event.mark_as_check}
                                    </span>
                                    <TickCircle size="20" variant="Bulk" color={'#E45B00'} />
                                  </button>
                                </li>
                              </div>
                            </ul>
                          </PopoverContent>
                        </Popover>
                      </TableCell> */}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {tickets.length === 0 && (
              <div
                className={
                  "w-132 lg:w-184 mx-auto flex flex-col items-center mt-8 gap-20"
                }
              >
                <div
                  className={
                    "w-[120px] h-[120px] rounded-full flex items-center justify-center bg-neutral-100"
                  }
                >
                  <div
                    className={
                      "w-[90px] h-[90px] rounded-full flex items-center justify-center bg-neutral-200"
                    }
                  >
                    <Money3 size="50" color="#0d0d0d" variant="Bulk" />
                  </div>
                </div>
                <div
                  className={"flex flex-col gap-12 items-center text-center"}
                >
                  <p
                    className={
                      "text-[1.8rem] leading-[25px] text-neutral-600 max-w-[330px] lg:max-w-[422px]"
                    }
                  >
                    {t("table.description")}
                  </p>
                  <div></div>
                </div>
              </div>
            )}
          </TabsContent>
          {event.eventTicketTypes.map((ticketClass, index) => {
            return (
              <TabsContent
                key={ticketClass.ticketTypeName}
                value={ticketClass.ticketTypeName}
                className={"w-full"}
              >
                <Table className={"mt-4"}>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className={
                          "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
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
                        {t("table.ticket_class")}
                      </TableHead>
                      <TableHead
                        className={
                          "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                        }
                      >
                        {t("table.amount")}
                      </TableHead>
                      <TableHead
                        className={
                          "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                        }
                      >
                        {t("table.check")}
                      </TableHead>
                      <TableHead
                        className={
                          "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                        }
                      >
                        {t("table.date_purchased")}
                      </TableHead>
                      {/* <TableHead
                      className={
                        "font-bold hidden lg:table-cell text-[1.1rem] pb-6 w-[40px] leading-6 text-deep-100 uppercase"
                      }
                    >
                      {single_event.table.date_purchased}
                    </TableHead> */}
                    </TableRow>
                  </TableHeader>
                  {filteredtickets
                    .filter(
                      (ticket) =>
                        ticket.ticketType === ticketClass.ticketTypeName,
                    )
                    .map((ticket) => {
                      const [order] = orders.filter(
                        (order) => ticket.orderId === order.orderId,
                      );
                      return (
                        <TableRow key={ticket.ticketId}>
                          <TableCell
                            className={
                              "text-[1.5rem] py-[15px] leading-8 text-neutral-900"
                            }
                          >
                            <Drawer direction={"right"}>
                              <DrawerTrigger>
                                <span className={"cursor-pointer"}>
                                  {ticket.ticketName}
                                </span>
                              </DrawerTrigger>
                              <Informations
                                event={event}
                                ticket={ticket}
                                order={order as Order}
                              />
                            </Drawer>
                          </TableCell>
                          <TableCell
                            className={
                              "text-[1.5rem] leading-8 text-neutral-900"
                            }
                          >
                            <Drawer direction={"right"}>
                              <DrawerTrigger>
                                <span className={"cursor-pointer"}>
                                  {ticket.fullName}
                                </span>
                              </DrawerTrigger>
                              <Informations
                                event={event}
                                ticket={ticket}
                                order={order as Order}
                              />
                            </Drawer>
                          </TableCell>
                          <TableCell className={"hidden lg:table-cell"}>
                            {ticket.ticketType === "general" && (
                              <span
                                className={
                                  "py-[3px] text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#EF1870]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                                }
                              >
                                general
                              </span>
                            )}
                            {ticket.ticketType === "vip" && (
                              <span
                                className={
                                  "py-[3px] text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#7A19C7]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                                }
                              >
                                vip
                              </span>
                            )}
                            {ticket.ticketType === "vvip" && (
                              <span
                                className={
                                  "py-[3px] text-[1.1rem] font-bold leading-[15px] text-center uppercase text-deep-100  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                                }
                              >
                                Premium vip
                              </span>
                            )}
                          </TableCell>
                          <TableCell
                            className={
                              "hidden lg:table-cell text-[1.5rem] font-medium leading-8 text-neutral-900"
                            }
                          >
                            {ticket.event.currency === "USD"
                              ? ticket.ticketUsdPrice
                              : ticket.ticketPrice}{" "}
                            {event.currency}
                          </TableCell>
                          <TableCell className={"hidden lg:table-cell"}>
                            {ticket.status === "CHECKED" && (
                              <span
                                className={
                                  "py-[3px] text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#349C2E]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                                }
                              >
                                {t("filters.checked")}
                              </span>
                            )}
                            {ticket.status === "PENDING" && (
                              <span
                                className={
                                  "py-[3px] text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#EA961C]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                                }
                              >
                                {t("filters.pending")}
                              </span>
                            )}
                            {ticket.status === "RETURNED" && (
                              <span
                                className={
                                  "py-[3px] text-[1.1rem] font-bold leading-[15px] text-center uppercase text-neutral-500  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                                }
                              >
                                {t("filters.returned")}
                              </span>
                            )}
                          </TableCell>
                          <TableCell
                            className={
                              "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                            }
                          >
                            {FormatDate(
                              ticket.createdAt,
                              locale,
                              event.eventDays[0].timezone,
                            )}
                          </TableCell>
                          {/* <TableCell className={'text-[1.5rem] leading-8 text-neutral-900'}>
                        <Popover>
                          <PopoverTrigger>
                            <button
                              className={
                                'w-[35px] h-[35px] cursor-pointer rounded-full bg-neutral-100 flex items-center justify-center'
                              }
                            >
                              <MoreCircle variant={'Bulk'} size={20} color={'#737C8A'} />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            className={
                              'w-[250px] p-0 m-0 bg-none shadow-none border-none mx-4'
                            }
                          >
                            <ul
                              className={
                                'bg-neutral-100 border border-neutral-200 right-8 p-4  mb-8 rounded-[1rem] shadow-xl bottom-full flex flex-col gap-4'
                              }
                            >
                              <span
                                className={
                                  'font-medium py-[5px] border-b-[1px] border-neutral-200 text-[1.4rem] text-deep-100 leading-8'
                                }
                              >
                                {t('more')}
                              </span>
                              <div className={'flex flex-col gap-4'}>
                                <li className={''}>
                                  <Drawer direction={'right'}>
                                    <DrawerTrigger className={'w-full'}>
                                      <button
                                        className={`font-normal cursor-pointer group text-[1.5rem] py-4 border-b-[1px] border-neutral-200 leading-8 text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
                                      >
                                        <span className={''}>{t('details')}</span>
                                        <HambergerMenu
                                          size="20"
                                          variant="Bulk"
                                          color={'#2E3237'}
                                        />
                                      </button>
                                    </DrawerTrigger>
                                    <Informations />
                                  </Drawer>
                                </li>
                                <li className={''}>
                                  <button
                                    className={`font-normal group text-[1.5rem] py-4 leading-8 text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
                                  >
                                    <span className={'text-primary-500'}>
                                      {single_event.mark_as_check}
                                    </span>
                                    <TickCircle size="20" variant="Bulk" color={'#E45B00'} />
                                  </button>
                                </li>
                              </div>
                            </ul>
                          </PopoverContent>
                        </Popover>
                      </TableCell> */}
                        </TableRow>
                      );
                    })}
                </Table>
                {filteredtickets.filter(
                  (ticket) => ticket.ticketType === ticketClass.ticketTypeName,
                ).length === 0 && (
                  <div
                    className={
                      "w-[330px] lg:w-[460px] mx-auto flex flex-col items-center mt-8 gap-[5rem]"
                    }
                  >
                    <div
                      className={
                        "w-[120px] h-[120px] rounded-full flex items-center justify-center bg-neutral-100"
                      }
                    >
                      <div
                        className={
                          "w-[90px] h-[90px] rounded-full flex items-center justify-center bg-neutral-200"
                        }
                      >
                        <Money3 size="50" color="#0d0d0d" variant="Bulk" />
                      </div>
                    </div>
                    <div
                      className={
                        "flex flex-col gap-12 items-center text-center"
                      }
                    >
                      <p
                        className={
                          "text-[1.8rem] leading-[25px] text-neutral-600 max-w-[330px] lg:max-w-[422px]"
                        }
                      >
                        {t("table.description")}
                      </p>
                      <div></div>
                    </div>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      <ReturnedTicketsSection event={event} ticketReturns={ticketReturns} />
    </div>
  );
}

export function Separator() {
  return (
    <div className={"w-full py-[15px]"}>
      <div className={"bg-neutral-200 w-full h-[2px]"}></div>
    </div>
  );
}
