"use client";
import { UserOrdersRequest } from "@ticketwaze/typescript-config";
import { ArrowLeft2, ArrowRight2, Money3, SearchNormal } from "iconsax-reactjs";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import WalletOrderDrawerContent from "../WalletOrderDrawerContent";
import formatDate from "@/lib/FormatDate";
import TruncateUrl from "@/lib/TruncateUrl";
import { Link } from "@/i18n/navigation";

export default function TransactionsPageContent({
  ordersRequest,
}: {
  ordersRequest: UserOrdersRequest;
}) {
  const t = useTranslations("Wallet");
  const locale = useLocale();
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const orders = ordersRequest.data;
  const filteredOrders = orders.filter((order) =>
    order.orderName.toLowerCase().includes(query.toLowerCase()),
  );
  const { meta } = ordersRequest;
  const currentPage = ordersRequest.meta.currentPage;
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
    <div className="flex flex-col gap-10 overflow-y-scroll">
      <header className="w-full flex items-center justify-between">
        <div className="flex flex-col gap-2">
          {session?.user && (
            <span className="text-[1.6rem] leading-8 text-neutral-600">
              {t("subtitle")}{" "}
              <span className="text-deep-100">{session?.user.firstName}</span>
            </span>
          )}
          <span className="font-primary font-medium text-[1.8rem] lg:text-[2.6rem] leading-10 lg:leading-12 text-black">
            {t("transactions.title")}
          </span>
        </div>
        <div className="bg-neutral-100 rounded-[30px] hidden lg:flex items-center gap-2 w-full lg:w-auto lg:min-w-[24.3rem] px-6 py-4">
          <input
            placeholder={t("search")}
            onChange={(e) => setQuery(e.target.value)}
            className="text-black font-normal text-[1.4rem] leading-8 w-full outline-none bg-transparent"
          />
          <SearchNormal size="20" color="#737c8a" variant="Bulk" />
        </div>
      </header>

      <div className="flex flex-col gap-8 ">
        <div className="bg-neutral-100 rounded-[30px] flex lg:hidden items-center gap-2 w-full lg:w-auto lg:min-w-[24.3rem] px-6 py-4">
          <input
            placeholder={t("search")}
            onChange={(e) => setQuery(e.target.value)}
            className="text-black font-normal text-[1.4rem] leading-8 w-full outline-none bg-transparent"
          />
          <SearchNormal size="20" color="#737c8a" variant="Bulk" />
        </div>
        <Table id="transactions-table">
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase">
                {t("transactions.table.id")}
              </TableHead>
              <TableHead className="font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase">
                {t("transactions.table.provider")}
              </TableHead>
              <TableHead className="font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase">
                {t("transactions.table.class")}
              </TableHead>
              <TableHead className="font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase">
                {t("transactions.table.amount")}
              </TableHead>
              <TableHead className="font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase">
                {t("transactions.table.status")}
              </TableHead>
              <TableHead className="font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase">
                {t("transactions.table.date")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.orderId}>
                <TableCell className="text-[1.5rem] py-6 leading-8 text-neutral-900">
                  <Drawer direction="right">
                    <DrawerTrigger>
                      <span className="cursor-pointer">
                        {TruncateUrl(order.orderName, 12)}
                      </span>
                    </DrawerTrigger>
                    <WalletOrderDrawerContent order={order} />
                  </Drawer>
                </TableCell>
                <TableCell className="text-[1.5rem] py-6 hidden lg:table-cell leading-8 text-neutral-900">
                  <Drawer direction="right">
                    <DrawerTrigger>
                      <span className="cursor-pointer">
                        {order.provider.toUpperCase()}
                      </span>
                    </DrawerTrigger>
                    <WalletOrderDrawerContent order={order} />
                  </Drawer>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900">
                  {order.tickets.length}
                </TableCell>
                <TableCell className="text-[1.5rem] font-medium leading-8 text-neutral-900">
                  <Drawer direction="right">
                    <DrawerTrigger>
                      <span className="cursor-pointer py-6">
                        {session?.user.userPreference.currency === "USD"
                          ? `${order.usdPrice} USD`
                          : `${order.amount} HTG`}
                      </span>
                    </DrawerTrigger>
                    <WalletOrderDrawerContent order={order} />
                  </Drawer>
                </TableCell>
                <TableCell className="py-6">
                  <Drawer direction="right">
                    <DrawerTrigger>
                      {order?.status === "SUCCESSFUL" && (
                        <span className="py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#349C2E] px-[5px] rounded-[30px] bg-[#f5f5f5]">
                          {t("filters.successful")}
                        </span>
                      )}
                      {order?.status === "PENDING" && (
                        <span className="py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#EA961C] px-[5px] rounded-[30px] bg-[#f5f5f5]">
                          {t("filters.pending")}
                        </span>
                      )}
                      {order?.status === "RETURNED" && (
                        <span className="py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-failure px-[5px] rounded-[30px] bg-[#f5f5f5]">
                          {t("filters.returned")}
                        </span>
                      )}
                      {order?.status === "FAILED" && (
                        <span className="py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-failure px-[5px] rounded-[30px] bg-[#f5f5f5]">
                          {t("filters.failed")}
                        </span>
                      )}
                    </DrawerTrigger>
                    <WalletOrderDrawerContent order={order} />
                  </Drawer>
                </TableCell>
                <TableCell className="text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900">
                  {formatDate(order.createdAt, locale, "local")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {orders.length === 0 && (
          <div className="w-[330px] lg:w-[460px] mx-auto flex flex-col items-center gap-[5rem]">
            <div className="w-[120px] h-[120px] rounded-full flex items-center justify-center bg-neutral-100">
              <div className="w-[90px] h-[90px] rounded-full flex items-center justify-center bg-neutral-200">
                <Money3 size="50" color="#0d0d0d" variant="Bulk" />
              </div>
            </div>
            <div className="flex flex-col gap-12 items-center text-center">
              <p className="text-[1.8rem] leading-[25px] text-neutral-600 max-w-[330px] lg:max-w-[422px]">
                {t("transactions.description")}
              </p>
            </div>
          </div>
        )}
        {/* Pagination */}
        {meta.lastPage > 1 && (
          <div className="flex items-center gap-2 pb-4">
            {/* Prev */}
            {hasPrev ? (
              <Link
                href={`/wallet/transactions?page=${currentPage - 1}`}
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
                  href={`/wallet/transactions?page=${meta.firstPage}#transactions-table`}
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
                href={`/wallet/transactions?page=${page}#transactions-table`}
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
                  href={`/wallet/transactions?page=${meta.lastPage}#transactions-table`}
                  className="w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full text-[1.3rem] font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                >
                  {meta.lastPage}
                </Link>
              </>
            )}

            {/* Next */}
            {hasNext ? (
              <Link
                href={`/wallet/transactions?page=${currentPage + 1}#transactions-table`}
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
    </div>
  );
}
