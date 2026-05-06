"use client";
import { OrganisationWithdrawalRequest } from "@ticketwaze/typescript-config";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import TruncateUrl from "@/lib/TruncateUrl";
import formatDate from "@/lib/FormatDate";
import { ArrowLeft2, ArrowRight2, Money3 } from "iconsax-reactjs";
import { Link } from "@/i18n/navigation";
import WithdrawalInformations from "../components/WithdrawalInformations";

export default function WithdrawalRequestPageContent({
  withdrawalRequest,
}: {
  withdrawalRequest: OrganisationWithdrawalRequest;
}) {
  const t = useTranslations("Finance");
  const locale = useLocale();
  const { data: session } = useSession();
  const currentOrganisation = session?.activeOrganisation;
  //   const [query, setQuery] = useState("");
  const requests = withdrawalRequest.data;
  //   const filteredOrders = requests.filter((request) =>
  //     order.orderName.toLowerCase().includes(query.toLowerCase()),
  //   );
  const { meta } = withdrawalRequest;
  const currentPage = withdrawalRequest.meta.currentPage;
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
    <div className={"flex flex-col gap-8 overflow-y-scroll"}>
      <div
        className={
          "flex flex-col lg:flex-row gap-8 w-full lg:items-center justify-between"
        }
      >
        {/* <span
          className={
            "font-primary font-medium text-left text-[18px] leading-10 text-black"
          }
        >
          {t("withdrawal.title")}
        </span> */}
        {/* <div className={"flex items-center gap-4"}>
            <div
              className={
                "bg-neutral-100 rounded-[30px] flex items-center gap-2 w-full lg:w-auto lg:min-w-[243px] px-[1.5rem] py-4"
              }
            >
              <input
                placeholder={t("search")}
                className={
                  "text-black font-normal text-[1.4rem] leading-8 w-full outline-none"
                }
              />
              <SearchNormal size="20" color="#737c8a" variant="Bulk" />
            </div>
          </div> */}
      </div>
      <Table id="withdrawal-table">
        <TableHeader>
          <TableRow>
            <TableHead
              className={
                "font-bold  text-[1.1rem] hidden lg:table-cell pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("withdrawal.table.id")}
            </TableHead>
            <TableHead
              className={
                "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("withdrawal.table.name")}
            </TableHead>
            <TableHead
              className={
                "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("withdrawal.table.account")}
            </TableHead>
            <TableHead
              className={
                "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("withdrawal.table.amount")}
            </TableHead>
            <TableHead
              className={
                "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("withdrawal.table.status")}
            </TableHead>
            <TableHead
              className={
                "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("withdrawal.table.date")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => {
            return (
              <TableRow key={request.withdrawalRequestId}>
                <TableCell
                  className={
                    "text-[1.5rem] hidden lg:table-cell py-6 leading-8 text-neutral-900"
                  }
                >
                  <Drawer direction={"right"}>
                    <DrawerTrigger>
                      <span className={"cursor-pointer"}>
                        {TruncateUrl(request.withdrawalRequestId, 14)}
                      </span>
                    </DrawerTrigger>
                    <WithdrawalInformations request={request} />
                  </Drawer>
                </TableCell>
                <TableCell
                  className={"text-[1.5rem] leading-8 text-neutral-900 py-6"}
                >
                  <Drawer direction={"right"}>
                    <DrawerTrigger>
                      <span className={"cursor-pointer"}>
                        {TruncateUrl(request.bankName ?? "", 14)}
                      </span>
                    </DrawerTrigger>
                    <WithdrawalInformations request={request} />
                  </Drawer>
                </TableCell>
                <TableCell
                  className={"text-[1.5rem] leading-8 text-neutral-900"}
                >
                  <Drawer direction={"right"}>
                    <DrawerTrigger>
                      <span className={"cursor-pointer"}>
                        {TruncateUrl(request.accountNumber ?? "", 14)}
                      </span>
                    </DrawerTrigger>
                    <WithdrawalInformations request={request} />
                  </Drawer>
                </TableCell>
                <TableCell
                  className={
                    "text-[1.5rem] hidden lg:table-cell font-medium leading-8 text-neutral-900"
                  }
                >
                  <Drawer direction={"right"}>
                    <DrawerTrigger>
                      <span className={"cursor-pointer"}>
                        {currentOrganisation?.currency === "USD"
                          ? request.usdAmount
                          : request.amount}{" "}
                        {currentOrganisation?.currency}
                      </span>
                    </DrawerTrigger>
                    <WithdrawalInformations request={request} />
                  </Drawer>
                </TableCell>
                <TableCell>
                  <Drawer direction={"right"}>
                    <DrawerTrigger>
                      <span className={"cursor-pointer"}>
                        {request.status.toUpperCase() === "SUCCESSFUL" && (
                          <span
                            className={
                              "py-[.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase text-[#349C2E]  px-4 rounded-[30px] bg-[#349C2E]/20"
                            }
                          >
                            {t("filters.successful")}
                          </span>
                        )}
                        {request.status.toUpperCase() === "PENDING" && (
                          <span
                            className={
                              "py-[.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase text-[#EA961C]  px-4 rounded-[30px] bg-[#EA961C]/20"
                            }
                          >
                            {t("filters.pending")}
                          </span>
                        )}
                      </span>
                    </DrawerTrigger>
                    <WithdrawalInformations request={request} />
                  </Drawer>
                </TableCell>
                <TableCell
                  className={
                    "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                  }
                >
                  <Drawer direction={"right"}>
                    <DrawerTrigger>
                      <span className={"cursor-pointer"}>
                        {formatDate(request.createdAt, locale, "local")}
                      </span>
                    </DrawerTrigger>
                    <WithdrawalInformations request={request} />
                  </Drawer>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {requests.length === 0 && (
        <div
          className={"w-132 lg:w-184 mx-auto flex flex-col items-center gap-20"}
        >
          <div
            className={
              "w-48 h-48 rounded-full flex items-center justify-center bg-neutral-100"
            }
          >
            <div
              className={
                "w-36 h-36 rounded-full flex items-center justify-center bg-neutral-200"
              }
            >
              <Money3 size="50" color="#0d0d0d" variant="Bulk" />
            </div>
          </div>
          <div className={"flex flex-col gap-12 items-center text-center"}>
            <p
              className={
                "text-[1.8rem] leading-10 text-neutral-600 max-w-132 lg:max-w-[42.2rem]"
              }
            >
              {t("withdrawal.description")}
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
              href={`/finance/withdrawal?page=${currentPage - 1}`}
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
                href={`/finance/withdrawal?page=${meta.firstPage}#withdrawal-table`}
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
              href={`/finance/withdrawal?page=${page}#withdrawal-table`}
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
                href={`/finance/withdrawal?page=${meta.lastPage}#withdrawal-table`}
                className="w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full text-[1.3rem] font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                {meta.lastPage}
              </Link>
            </>
          )}

          {/* Next */}
          {hasNext ? (
            <Link
              href={`/finance/withdrawal?page=${currentPage + 1}#withdrawal-table`}
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
