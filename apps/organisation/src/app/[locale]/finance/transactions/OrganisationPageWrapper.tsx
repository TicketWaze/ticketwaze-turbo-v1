"use client";
import { Order, OrganisationOrders } from "@ticketwaze/typescript-config";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocale, useTranslations } from "next-intl";
import TruncateUrl from "@/lib/TruncateUrl";
import formatDate from "@/lib/FormatDate";
import OrdersInformations from "../components/OrdersInformations";
import { Link } from "@/i18n/navigation";
import { ArrowLeft2, ArrowRight2 } from "iconsax-reactjs";

export default function OrganisationPageWrapper({
  organisationOrders,
}: {
  organisationOrders: OrganisationOrders;
}) {
  const t = useTranslations("Finance");
  // The API returns only ticketed (event) orders; guard anyway, since every
  // cell reads tickets[0].event and one bad row would crash the table.
  const orders = organisationOrders.data.filter((order) =>
    Boolean(order.tickets?.[0]?.event),
  );
  const locale = useLocale();
  const { meta } = organisationOrders;
  const currentPage = organisationOrders.meta.currentPage;
  const hasPrev = currentPage > meta.firstPage;
  const hasNext = currentPage < meta.lastPage;

  // Build page number buttons (show up to 5 around current page)
  const getPageNumbers = () => {
    const range: number[] = [];
    const delta = 2;
    const left = Math.max(meta.firstPage, currentPage - delta);
    const right = Math.min(meta.lastPage, currentPage + delta);
    for (let i = left; i <= right; i++) range.push(i);
    return range;
  };
  return (
    <div className={" flex-col gap-8 overflow-y-scroll"}>
      <Table id="transactions-table">
        <TableHeader>
          <TableRow>
            <TableHead
              className={
                "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("transactions.table.id")}
            </TableHead>
            <TableHead
              className={
                "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("transactions.table.name")}
            </TableHead>
            <TableHead
              className={
                "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("transactions.table.amount")}
            </TableHead>
            <TableHead
              className={
                "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("transactions.table.status")}
            </TableHead>
            <TableHead
              className={
                "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("transactions.table.date")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            return (
              <Drawer direction={"right"} key={order.orderId}>
                <DrawerTrigger asChild>
                  <TableRow className={"cursor-pointer"}>
                    <TableCell
                      className={
                        "text-[1.5rem] hidden lg:table-cell py-6 leading-8 text-neutral-900"
                      }
                    >
                      {TruncateUrl(order.orderName, 15)}
                    </TableCell>
                    <TableCell
                      className={
                        "text-[1.5rem] py-6 leading-8 text-neutral-900"
                      }
                    >
                      {TruncateUrl(order.tickets[0].event.eventName, 20)}
                    </TableCell>
                    <TableCell
                      className={
                        "text-[1.5rem] font-medium leading-8 text-neutral-900"
                      }
                    >
                      {order.tickets[0].event.currency === "USD"
                        ? order.tickets.reduce(
                            (sum, t) => sum + Number(t.ticketUsdPrice),
                            0,
                          )
                        : order.tickets.reduce(
                            (sum, t) => sum + Number(t.ticketPrice),
                            0,
                          )}{" "}
                      {order.tickets[0].event.currency}
                    </TableCell>
                    <TableCell className={"hidden lg:table-cell"}>
                      {order?.status === "SUCCESSFUL" && (
                        <span
                          className={
                            "py-[.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase text-[#349C2E]  px-2 rounded-[30px] bg-[#f5f5f5]"
                          }
                        >
                          {t("filters.successful")}
                        </span>
                      )}
                      {order?.status === "RETURNED" && (
                        <span
                          className={
                            "py-[.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase text-failure  px-2 rounded-[30px] bg-failure/10"
                          }
                        >
                          {t("filters.returned")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell
                      className={
                        "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                      }
                    >
                      {formatDate(
                        order.createdAt,
                        locale,
                        order.tickets[0].event.eventDays[0].timezone,
                      )}
                    </TableCell>
                  </TableRow>
                </DrawerTrigger>
                <OrdersInformations
                  tickets={order.tickets}
                  order={order as Order}
                />
              </Drawer>
            );
          })}
        </TableBody>
      </Table>
      {/* Pagination */}
      {meta.lastPage > 1 && (
        <div className="flex items-center gap-2 pb-4">
          {/* Prev */}
          {hasPrev ? (
            <Link
              href={`/finance/transactions?page=${currentPage - 1}`}
              className="w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
            >
              <ArrowLeft2 size="20" color="#E45B00" variant="Bulk" />
            </Link>
          ) : (
            <span className="w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full opacity-30 cursor-not-allowed">
              <ArrowLeft2 size="20" color="#E45B00" variant="Bulk" />
            </span>
          )}

          {/* First page + ellipsis */}
          {getPageNumbers()[0] > meta.firstPage && (
            <>
              <Link
                href={`/finance/transactions?page=${meta.firstPage}#transactions-table`}
                className="w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full text-[1.3rem] font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                {meta.firstPage}
              </Link>
              {getPageNumbers()[0] > meta.firstPage + 1 && (
                <span className="text-[1.3rem] text-neutral-400 px-1">…</span>
              )}
            </>
          )}

          {/* Page number links */}
          {getPageNumbers().map((page) => (
            <Link
              key={page}
              href={`/finance/transactions?page=${page}#transactions-table`}
              className={`w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full text-[1.3rem] font-medium transition-colors
                ${
                  page === currentPage
                    ? "text-primary-500 pointer-events-none"
                    : "text-neutral-600 hover:text-primary-500"
                }`}
            >
              {page}
            </Link>
          ))}

          {/* Last page + ellipsis */}
          {getPageNumbers().at(-1)! < meta.lastPage && (
            <>
              {getPageNumbers().at(-1)! < meta.lastPage - 1 && (
                <span className="text-[1.3rem] text-neutral-400 px-1">…</span>
              )}
              <Link
                href={`/finance/transactions?page=${meta.lastPage}#transactions-table`}
                className="w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full text-[1.3rem] font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                {meta.lastPage}
              </Link>
            </>
          )}

          {/* Next */}
          {hasNext ? (
            <Link
              href={`/finance/transactions?page=${currentPage + 1}#transactions-table`}
              className="w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
            >
              <ArrowRight2 size="20" color="#E45B00" variant="Bulk" />
            </Link>
          ) : (
            <span className="w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full opacity-30 cursor-not-allowed">
              <ArrowRight2 size="20" color="#E45B00" variant="Bulk" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
