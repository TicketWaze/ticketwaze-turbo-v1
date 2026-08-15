"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Money3, SearchNormal } from "iconsax-reactjs";
import { Sale, SaleBuyer } from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import TopBar from "@/components/shared/TopBar";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import FormatDate from "@/lib/FormatDate";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SaleMoreComponent from "./components/SaleMoreComponent";

/**
 * THE SELLER'S PAGE FOR ONE DIGITAL PRODUCT.
 *
 * Built to read as an event page, because it is the same job: a headline row of
 * numbers, then the list of people who paid. The description and cover used to
 * sit in the middle of this page and now live behind "Details" in the More menu
 * — a seller opening this screen wants to know how it is selling, not to re-read
 * their own blurb.
 *
 * The file itself is not here either. Replacing it lives on the edit page,
 * where the rest of the product is changed, and its facts are in the same
 * drawer as the description — one place to change the product, one place to
 * read it, and no second copy of the warning about what a replacement does.
 *
 * The one thing kept from the file on this page is the VERSION column in the
 * buyers table, which is about the buyers rather than the file: after a
 * replacement they are split across versions, and nothing else shows that.
 */
export default function SalePageDetails({ sale }: { sale: Sale }) {
  const t = useTranslations("Sales.single_sale");
  const locale = useLocale();
  const { data: session } = useSession();

  const sellerPrice = sale.currencyCode === "USD" ? sale.usdPrice : sale.price;
  const buyerPays = sale.pricing?.buyerPays ?? sellerPrice;
  // Only to tell a buyer's version apart from the one on sale today.
  const current = sale.files?.find((f) => f.isCurrent) ?? sale.files?.[0];

  /**
   * The totals come from the API, counted over every buyer.
   *
   * They are deliberately NOT summed from the rows below: those are the latest
   * ten, so adding them up would report the revenue of the last ten sales and
   * label it the revenue. Refunds are already excluded server-side, so the
   * figures agree with the seller's balance.
   */
  const summary = sale.buyersSummary;
  const revenue =
    sale.currencyCode === "USD"
      ? (summary?.usdRevenue ?? 0)
      : (summary?.revenue ?? 0);

  /** The first page, as served with the product. */
  const initialBuyers = sale.buyers ?? [];

  const [term, setTerm] = useState("");
  /**
   * RESULTS CARRY THE TERM THEY ANSWER.
   *
   * Storing the term alongside the rows removes the need for a separate
   * "searching" flag entirely: a request is in flight exactly when the results
   * on screen do not answer what is currently typed. One piece of state instead
   * of two that can disagree, and nothing to reset when the box is cleared.
   */
  const [results, setResults] = useState<{
    term: string;
    rows: SaleBuyer[];
  } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const trimmedTerm = term.trim();
  const isSearchActive = trimmedTerm.length > 0;
  /**
   * Falling back to the page-load rows whenever the box is empty means clearing
   * it restores the original ten with no round trip and no state to unwind.
   * While a new term is in flight the rows already on screen stay put rather
   * than blinking out.
   */
  const buyers = isSearchActive
    ? (results?.rows ?? initialBuyers)
    : initialBuyers;
  const searching = isSearchActive && results?.term !== trimmedTerm;

  /**
   * One request per keystroke, with the previous one aborted as the next goes
   * out. Aborting is what keeps the results honest: without it a slow early
   * request can land after a faster later one and overwrite the newer results
   * with stale rows.
   */
  useEffect(() => {
    abortRef.current?.abort();

    // Nothing to search. No state is reset here on purpose: `buyers` already
    // falls back to the page-load rows whenever the box is empty, so there is
    // nothing to unwind and nothing to write on the way out.
    if (!trimmedTerm) return;

    const token = session?.user.accessToken;
    if (!token) return;

    const controller = new AbortController();
    abortRef.current = controller;

    const params = new URLSearchParams({ search: trimmedTerm, limit: "50" });

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/sales/${sale.organisationId}/${sale.saleId}/buyers?${params.toString()}`,
      {
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    )
      .then((response) => response.json())
      .then((response) => {
        setResults({ term: trimmedTerm, rows: response?.data?.buyers ?? [] });
      })
      .catch((error) => {
        // An aborted request was replaced by a newer one; it owns the state now.
        if (error?.name === "AbortError") return;
        setResults({ term: trimmedTerm, rows: [] });
      });

    return () => controller.abort();
  }, [
    trimmedTerm,
    session?.user.accessToken,
    sale.organisationId,
    sale.saleId,
  ]);

  return (
    <div className={"flex flex-col gap-12 overflow-y-scroll"}>
      <TopBar title={sale.title}>
        <div className="hidden lg:flex items-center gap-4">
          <SaleMoreComponent sale={sale} />
        </div>
      </TopBar>

      {/* headline numbers, in the event page's grid */}
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
            {formatMoney(revenue, sale.currencyCode, locale)}
          </p>
        </li>
        <li className={"pl-10 pb-12"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("stats.sold")}
          </span>
          <p className={"font-medium text-[25px] leading-12 font-primary"}>
            {summary?.sold ?? 0}
          </p>
        </li>
        <li className={"pt-8 lg:pt-0 lg:pl-10 pb-12"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("stats.buyer_pays")}
          </span>
          <p className={"font-medium text-[25px] leading-12 font-primary"}>
            {formatMoney(buyerPays, sale.currencyCode, locale)}
            <span
              className={"font-normal text-[1.6rem] text-neutral-500 block"}
            >
              {t("stats.you_receive_inline", {
                amount: formatMoney(sellerPrice, sale.currencyCode, locale),
              })}
            </span>
          </p>
        </li>
        <li className={"pt-8 lg:pt-0 lg:pl-10 pb-12"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("stats.status")}
          </span>
          <p className={"font-medium text-[25px] leading-12 font-primary"}>
            {t(`status.${sale.status}`)}
          </p>
        </li>
      </ul>

      {/* where the product stands. Only one of these is ever true: the status
          is a single linear path, not independent switches. */}
      {sale.status === "draft" && (
        <Banner tone="neutral">{t("banners.draft")}</Banner>
      )}
      {sale.status === "scanning" && (
        <Banner tone="warning">{t("banners.scanning")}</Banner>
      )}
      {sale.status === "pending_review" && (
        <Banner tone="warning">{t("banners.pending_review")}</Banner>
      )}
      {sale.status === "rejected" && (
        <Banner tone="failure">
          {t("banners.rejected")}
          {sale.rejectionReason ? ` — ${sale.rejectionReason}` : ""}
        </Banner>
      )}
      {sale.status === "unlisted" && (
        <Banner tone="neutral">{t("banners.unlisted")}</Banner>
      )}

      {/* mobile actions */}
      <div className="flex lg:hidden items-center w-full gap-8 justify-end">
        <SaleMoreComponent sale={sale} />
      </div>

      {/* WHO BOUGHT IT — the event page's ticket table, for a product. */}
      <div className="w-full h-full">
        <div
          className={"flex flex-col lg:flex-row gap-6 w-full justify-between"}
        >
          <span className="font-primary text-deep-100 font-medium text-[1.8rem] order-2 lg:order-1 self-center lg:self-auto">
            {t("buyers.title")}
            {/* Says what the ten rows are a window onto, so a seller with 400
                buyers does not read the table as the whole list. */}
            {!isSearchActive &&
              (summary?.total ?? 0) > initialBuyers.length && (
                <span className="font-sans font-normal text-[1.4rem] text-neutral-600 ml-2">
                  {t("buyers.showing_latest", {
                    count: initialBuyers.length,
                    total: summary?.total ?? 0,
                  })}
                </span>
              )}
          </span>
          {/* The box stays mounted whatever the results are: unmounting it when
              a search returns nothing would take the focus and the term away
              mid-typing, and there would be no way to correct a typo. */}
          {((summary?.total ?? 0) > 0 || isSearchActive) && (
            <div
              className={
                "bg-neutral-100 order-1 lg:order-2 w-full rounded-[30px] flex items-center justify-between lg:w-[24.3rem] px-6 py-4"
              }
            >
              <input
                value={term}
                placeholder={t("buyers.search")}
                className={
                  "text-black font-normal text-[1.4rem] leading-8 w-full outline-none"
                }
                onChange={(e) => setTerm(e.target.value)}
              />
              <SearchNormal size="20" color="#737c8a" variant="Bulk" />
            </div>
          )}
        </div>

        {/* The results area owns the search loader: the stats, the heading and
            the search box stay usable while a query is in flight, and the rows
            already on screen stay readable underneath it rather than being
            replaced by a spinner. `min-h-40` keeps the overlay somewhere to sit
            when the table is empty. */}
        <div className="relative min-h-40">
          {searching && (
            <div className="absolute inset-0 z-10 flex items-start justify-center pt-20 bg-white/70">
              <LoadingCircleSmall />
            </div>
          )}
          <Table className={"mt-4"}>
            <TableHeader>
              <TableRow>
                <TableHead
                  className={
                    "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                  }
                >
                  {t("buyers.table.name")}
                </TableHead>
                <TableHead
                  className={
                    "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                  }
                >
                  {t("buyers.table.email")}
                </TableHead>
                <TableHead
                  className={
                    "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                  }
                >
                  {t("buyers.table.amount")}
                </TableHead>
                {/* The column with no event equivalent: after a file is replaced,
                  buyers are split across versions and this is where that shows. */}
                <TableHead
                  className={
                    "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                  }
                >
                  {t("buyers.table.version")}
                </TableHead>
                <TableHead
                  className={
                    "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                  }
                >
                  {t("buyers.table.downloads")}
                </TableHead>
                <TableHead
                  className={
                    "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                  }
                >
                  {t("buyers.table.date_purchased")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buyers.map((buyer) => (
                <TableRow key={buyer.entitlementId}>
                  <TableCell
                    className={"text-[1.5rem] py-6 leading-8 text-neutral-900"}
                  >
                    {buyer.fullName ?? t("buyers.deleted_account")}
                    {buyer.revokedAt && (
                      <span
                        className={
                          "block mt-2 py-[0.3rem] text-[1.1rem] font-bold leading-6 uppercase text-neutral-500 px-2 rounded-[30px] bg-[#f5f5f5] w-fit"
                        }
                      >
                        {t("buyers.refunded")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell
                    className={
                      "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                    }
                  >
                    {buyer.email ?? "—"}
                  </TableCell>
                  <TableCell
                    className={
                      "hidden lg:table-cell text-[1.5rem] font-medium leading-8 text-neutral-900"
                    }
                  >
                    {formatMoney(
                      sale.currencyCode === "USD"
                        ? buyer.usdPrice
                        : buyer.price,
                      sale.currencyCode,
                      locale,
                    )}
                  </TableCell>
                  <TableCell className={"hidden lg:table-cell"}>
                    {buyer.fileVersion ? (
                      <span
                        className={`py-[0.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase px-2 rounded-[30px] bg-[#f5f5f5] ${
                          // Highlighted only when it is NOT the version on sale
                          // today, because that is the case worth noticing.
                          current && buyer.fileVersion !== current.version
                            ? "text-[#EA961C]"
                            : "text-[#EF1870]"
                        }`}
                      >
                        {t("buyers.version_label", {
                          version: buyer.fileVersion,
                        })}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell
                    className={"text-[1.5rem] leading-8 text-neutral-900"}
                  >
                    {buyer.downloadCount}
                  </TableCell>
                  <TableCell
                    className={
                      "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                    }
                  >
                    {FormatDate(buyer.purchasedAt, locale, "local")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* An empty search is not an empty product: the "nobody has bought this"
            illustration would be wrong while a query is narrowing the list, and
            wrong again for the moment a request is still in flight. */}
          {buyers.length === 0 && !searching && isSearchActive && (
            <p className="text-[1.8rem] text-neutral-600 leading-10 text-center mt-16">
              {t("buyers.no_results", { term: trimmedTerm })}
            </p>
          )}

          {buyers.length === 0 && !searching && !isSearchActive && (
            <div
              className={
                "w-132 lg:w-184 mx-auto flex flex-col items-center mt-8 gap-20"
              }
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
                  {t("buyers.empty")}
                </p>
                <div></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Banner({
  tone,
  children,
}: {
  tone: "neutral" | "warning" | "failure";
  children: React.ReactNode;
}) {
  const styles = {
    neutral: {
      box: "border-neutral-200 bg-neutral-50",
      dot: "bg-neutral-400",
      text: "text-neutral-600",
    },
    warning: {
      box: "border-amber-200 bg-amber-50",
      dot: "bg-amber-500",
      text: "text-amber-700",
    },
    failure: {
      box: "border-failure/30 bg-[#FCE5EA]",
      dot: "bg-failure",
      text: "text-neutral-700",
    },
  }[tone];

  return (
    <div
      className={`flex items-start gap-4 rounded-[15px] border p-6 ${styles.box}`}
    >
      <div
        className={`w-[0.8rem] h-[0.8rem] rounded-full mt-[0.6rem] shrink-0 ${styles.dot}`}
      />
      <p className={`text-[1.5rem] leading-8 ${styles.text}`}>{children}</p>
    </div>
  );
}
