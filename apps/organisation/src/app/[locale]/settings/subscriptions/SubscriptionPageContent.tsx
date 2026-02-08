"use client";
import { LinkPrimary } from "@/components/shared/Links";
import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  MembershipTier,
  OrganisationSubscription,
} from "@ticketwaze/typescript-config";
import { Crown, Money3 } from "iconsax-reactjs";
import { useTranslations } from "next-intl";

export default function SubscriptionPageContent({
  organisationSubscriptions,
  membershipTier,
}: {
  organisationSubscriptions: OrganisationSubscription[];
  membershipTier: MembershipTier;
}) {
  const t = useTranslations("Settings.subscriptions");
  return (
    <div className={"flex flex-col gap-[3rem] overflow-y-scroll"}>
      <div className={"grid grid-cols-1 lg:grid-cols-3 gap-8"}>
        {/* FREE */}
        <div
          className={
            "bg-neutral-100 rounded-[20px] p-8 flex flex-col gap-[50px]"
          }
        >
          <div className={"flex items-start justify-between w-full"}>
            <span
              className={
                " font-medium flex-1 word-wrap text-[1.5rem] leading-[20px]"
              }
            >
              {t("free.subtitle")}
            </span>
            {membershipTier.membershipName === "free" && (
              <span
                className={
                  " font-bold text-white text-[1.1rem] leading-[15px] tracking-widest px-[5px] py-[2.5px] bg-primary-500 rounded-[30px]"
                }
              >
                {t("pro.tag")}
              </span>
            )}
          </div>
          <span
            className={
              "text-black text-[2.5rem] lg:text-[5rem] leading-[100%] font-primary font-medium text-center"
            }
          >
            {t("free.title")}
          </span>
        </div>
        {/* PRO */}
        <div
          className={
            "bg-primary-900 text-white rounded-[20px] p-8 flex flex-col gap-[50px]"
          }
        >
          <div className={"flex items-start justify-between w-full"}>
            <span
              className={
                " font-medium flex-1 word-wrap text-[1.5rem] leading-[20px]"
              }
            >
              {t("pro.subtitle")}
            </span>
            {membershipTier.membershipName === "pro" && (
              <span
                className={
                  " font-bold text-white text-[1.1rem] leading-[15px] tracking-widest px-[5px] py-[2.5px] bg-primary-500 rounded-[30px]"
                }
              >
                {t("pro.tag")}
              </span>
            )}
          </div>
          <span
            className={
              " text-[2.5rem] lg:text-[5rem] leading-[100%] font-primary font-medium text-center"
            }
          >
            {t("pro.title")}
          </span>
        </div>
        {/* PREMIUM */}
        <div className="flex-1  p-[2px] rounded-[30px] bg-gradient-to-r from-primary-500 via-[#E752AE] to-[#DD068B]">
          <div
            className={"bg-white rounded-[30px] p-8 flex flex-col gap-[50px]"}
          >
            <div className={"flex items-start justify-between w-full"}>
              <span
                className={
                  " font-medium flex-1 word-wrap text-[1.5rem] leading-[20px]"
                }
              >
                {t("premium.subtitle")}
              </span>
              {membershipTier.membershipName === "premium" && (
                <span
                  className={
                    " font-bold text-white text-[1.1rem] leading-[15px] tracking-widest px-[5px] py-[2.5px] bg-primary-500 rounded-[30px]"
                  }
                >
                  {t("pro.tag")}
                </span>
              )}
            </div>
            <span
              className={
                "text-black text-[2.5rem] lg:text-[5rem] leading-[100%] font-primary font-medium text-center"
              }
            >
              {t("premium.title")}
            </span>
          </div>
        </div>
      </div>
      <div className="flex-1  lg:hidden p-[2px] rounded-[30px] bg-gradient-to-r from-primary-500 via-[#E752AE] to-[#DD068B]">
        <LinkPrimary
          className="bg-transparent gap-4 items-center"
          href="/settings/subscriptions/upgrade"
        >
          <Crown size="24" color="#fff" variant="Bulk" />
          {t("upgrade")}
        </LinkPrimary>
      </div>
      <div className={"flex flex-col gap-8"}>
        <div
          className={
            "flex flex-col gap-8 lg:gap-0 lg:flex-row w-full items-center justify-between"
          }
        >
          <span
            className={
              "font-primary  w-full font-medium text-[18px] leading-[25px] text-black"
            }
          >
            {t("history")}
          </span>
          {/* <div
            className={
              "bg-neutral-100 rounded-[30px] flex items-center gap-2 w-full lg:w-auto lg:min-w-[243px] px-[1.5rem] py-4"
            }
          >
            <input
              placeholder={t("search")}
              className={
                "text-black font-normal text-[1.4rem] leading-[20px] w-full outline-none"
              }
            />
            <SearchNormal size="20" color="#737c8a" variant="Bulk" />
          </div> */}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className={
                  "font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                }
              >
                {t("table.id")}
              </TableHead>
              <TableHead
                className={
                  "font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                }
              >
                {t("table.tier")}
              </TableHead>
              <TableHead
                className={
                  "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                }
              >
                {t("table.amount")}
              </TableHead>
              <TableHead
                className={
                  "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                }
              >
                {t("table.status")}
              </TableHead>
              <TableHead
                className={
                  "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                }
              >
                {t("table.date")}
              </TableHead>
            </TableRow>
          </TableHeader>
          {/* <TableBody>
                  {tickets.map((ticket) => {
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
                            <Informations ticket={ticket} order={order as Order} />
                          </Drawer>
                        </TableCell>
                        <TableCell
                          className={"text-[1.5rem] leading-8 text-neutral-900"}
                        >
                          <Drawer direction={"right"}>
                            <DrawerTrigger>
                              <span className={"cursor-pointer"}>
                                {ticket.event.eventName}
                              </span>
                            </DrawerTrigger>
                            <Informations ticket={ticket} order={order as Order} />
                          </Drawer>
                        </TableCell>
                        <TableCell className={"hidden lg:table-cell"}>
                          {ticket.ticketType.toUpperCase() === "GENERAL" && (
                            <span
                              className={
                                "py-[3px] text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#EF1870]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                              }
                            >
                              general
                            </span>
                          )}
                          {ticket.ticketType.toUpperCase() === "VIP" && (
                            <span
                              className={
                                "py-[3px] text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#7A19C7]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                              }
                            >
                              vip
                            </span>
                          )}
                          {ticket.ticketType.toUpperCase() === "VVIP" && (
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
                            "text-[1.5rem] hidden lg:table-cell font-medium leading-8 text-neutral-900"
                          }
                        >
                          {ticket.event.currency === "USD"
                            ? ticket.ticketUsdPrice
                            : ticket.ticketPrice}{" "}
                          {ticket.event.currency}
                        </TableCell>
                        <TableCell className={"hidden lg:table-cell"}>
                          {order?.status === "SUCCESSFUL" && (
                            <span
                              className={
                                "py-[3px] text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#349C2E]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                              }
                            >
                              {t("filters.successful")}
                            </span>
                          )}
                          {order?.status === "PENDING" && (
                            <span
                              className={
                                "py-[3px] text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#EA961C]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                              }
                            >
                              {t("filters.pending")}
                            </span>
                          )}
                        </TableCell>
                        <TableCell
                          className={
                            "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                          }
                        >
                          {FormatDate(ticket.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody> */}
        </Table>
        {organisationSubscriptions.length === 0 && (
          <div
            className={
              "w-[330px] lg:w-[460px] mx-auto flex flex-col items-center gap-[5rem]"
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
              className={"flex flex-col gap-[3rem] items-center text-center"}
            >
              <p
                className={
                  "text-[1.8rem] leading-[25px] text-neutral-600 max-w-[330px] lg:max-w-[422px]"
                }
              >
                {t("description")}
              </p>
            </div>
          </div>
        )}
        {/* {tickets.length > 0 && (
                <div className={"w-full flex justify-end"}>
                  <Link
                    href={"/finance/transactions"}
                    className={
                      "text-primary-500 justify-end flex gap-4 items-center text-[1.5rem] leading-[20px]"
                    }
                  >
                    {t("transactions.more")}
                    <ArrowRight2 size="20" color="#E45B00" variant="Bulk" />
                  </Link>
                </div>
              )} */}
        <div></div>
      </div>
    </div>
  );
}
