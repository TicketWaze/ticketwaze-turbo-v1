"use client";

import { ReactNode, useEffect, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { ArrowLeft2, ArrowRight2 } from "iconsax-reactjs";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import PageTitle, { PAGE_SCROLLER } from "@/components/shared/PageTitle";
import SearchInput from "@/components/shared/SearchInput";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Drawer } from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Money from "@ticketwaze/ui/assets/icons/moneys.svg";
import FinanceActivityDrawer from "./FinanceActivityDrawer";
import {
  FINANCE_PERIODS,
  formatAmount,
  formatMoney,
  type FinanceActivitiesPage,
  type FinancePeriod,
  type FinanceSummary,
  type Money as MoneyAmount,
} from "./types";

const badgeBase =
  "py-[0.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase px-2 rounded-[30px] bg-[#f5f5f5]";

const TYPE_COLOR: Record<string, string> = {
  event: "#EF1870",
  raffle: "#7A19C7",
  sale: "#3b82f6",
  restaurant: "#EA961C",
};

export default function FinancePageContent({
  summary,
  activities,
  period,
  search,
}: {
  summary: FinanceSummary;
  activities: FinanceActivitiesPage;
  period: FinancePeriod;
  search: string;
}) {
  const t = useTranslations("Finance");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [term, setTerm] = useState(search);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function hrefFor(next: { period?: string; page?: number; search?: string }) {
    const params = new URLSearchParams();
    const p = next.period ?? period;
    if (p !== "all") params.set("period", p);
    const s = next.search ?? term.trim();
    if (s) params.set("search", s);
    const page = next.page ?? 1;
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function navigate(href: string) {
    startTransition(() => router.replace(href, { scroll: false }));
  }

  /**
   * Search is server-side so it covers every activity, not just the page on
   * screen. Debounced so a word typed is one request, not one per letter.
   */
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const handle = setTimeout(
      () => navigate(hrefFor({ search: term.trim(), page: 1 })),
      350,
    );
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  const subscriptionsUsd = summary.breakdown.subscriptions.usd;
  // USD on the card, the same money in HTG underneath.
  const cards: { label: string; value: MoneyAmount; note?: string }[] = [
    {
      label: t("summary.total_earned"),
      value: summary.gross,
      note:
        subscriptionsUsd > 0
          ? t("summary.includes_subscriptions", {
              amount: formatAmount(subscriptionsUsd),
            })
          : undefined,
    },
    {
      label: t("summary.moncash_earned"),
      value: summary.channels.moncash.gross,
    },
    {
      label: t("summary.stripe_earned"),
      value: summary.channels.stripe.gross,
    },
    { label: t("summary.total_net"), value: summary.net },
    { label: t("summary.moncash_net"), value: summary.channels.moncash.net },
    { label: t("summary.stripe_net"), value: summary.channels.stripe.net },
  ];

  const rows = activities.data;
  const { meta } = activities;

  return (
    <div className={`${PAGE_SCROLLER} gap-12 pb-8 overflow-x-hidden min-w-0`}>
      <PageTitle
        className="-mb-12"
        actions={
          <Select
            value={period}
            onValueChange={(value) =>
              navigate(hrefFor({ period: value, page: 1 }))
            }
          >
            <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] py-[0.8rem] px-6 border-none w-fit text-[1.4rem] text-neutral-700 leading-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-neutral-100 text-[1.4rem]">
              <SelectGroup>
                {FINANCE_PERIODS.map((p) => (
                  <SelectItem
                    key={p}
                    value={p}
                    className="text-[1.4rem] text-deep-100"
                  >
                    {t(`periods.${p}`)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        }
      >
        {t("title")}
      </PageTitle>

      {/* Summary: earnings on the first row, estimated net on the second
          (3 per row desktop, 2 per row mobile), same grid as payouts. */}
      <div className="grid grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-neutral-100 border-neutral-100 border-y">
        {cards.map((card, i) => (
          <div key={i} className="px-4 py-6">
            <span className="block text-[14px] text-neutral-600 leading-8 pb-2">
              {card.label}
            </span>
            <p
              className={`font-medium text-[1.6rem] lg:text-[22px] leading-10 font-primary ${card.value.usd < 0 ? "text-failure" : ""}`}
            >
              {formatAmount(card.value.usd)}{" "}
              <span className="text-neutral-600 text-[1.4rem]">USD</span>
            </p>
            <span className="block text-[1.2rem] text-neutral-500 leading-6 pt-1">
              {formatAmount(card.value.htg)} HTG
            </span>
            {card.note && (
              <span className="block text-[1.2rem] text-neutral-500 leading-6">
                {card.note}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <h4 className="font-medium font-primary text-[1.8rem] leading-10 text-black">
            {t("activities.title")}
          </h4>
          <SearchInput
            value={term}
            onChange={setTerm}
            placeholder={t("activities.search")}
            className="lg:w-[32rem]"
          />
        </div>

        <div className="relative min-h-40">
          {isPending && (
            <div className="absolute inset-0 z-10 flex items-start justify-center pt-20 bg-white/70">
              <LoadingCircleSmall />
            </div>
          )}

          {rows.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <Th>{t("activities.table.activity")}</Th>
                  <Th className="hidden lg:table-cell">
                    {t("activities.table.type")}
                  </Th>
                  <Th className="hidden lg:table-cell">
                    {t("activities.table.organisation")}
                  </Th>
                  <Th className="hidden lg:table-cell">
                    {t("activities.table.sold")}
                  </Th>
                  <Th className="hidden lg:table-cell">
                    {t("activities.table.collected")}
                  </Th>
                  <Th>{t("activities.table.earned")}</Th>
                  <Th className="hidden lg:table-cell">
                    {t("activities.table.net")}
                  </Th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.activityId}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedId(row.activityId);
                      setDrawerOpen(true);
                    }}
                  >
                    <Td>
                      <span
                        title={row.name}
                        className="block max-w-[16rem] lg:max-w-[26rem] truncate"
                      >
                        {row.name}
                      </span>
                    </Td>
                    <Td className="hidden lg:table-cell">
                      <span
                        style={{ color: TYPE_COLOR[row.activityType] }}
                        className={badgeBase}
                      >
                        {t(`types.${row.activityType}`)}
                      </span>
                    </Td>
                    <Td className="hidden lg:table-cell">
                      <span
                        title={row.organisationName}
                        className="block max-w-[18rem] truncate"
                      >
                        {row.organisationName}
                      </span>
                    </Td>
                    <Td className="hidden lg:table-cell">{row.unitsSold}</Td>
                    <Td className="hidden lg:table-cell">
                      <MoneyCell money={row.collected} currency={row.currency} />
                    </Td>
                    <Td className="font-medium">
                      <MoneyCell money={row.fees} currency={row.currency} />
                    </Td>
                    <Td
                      className={`hidden lg:table-cell ${(row.currency === "USD" ? row.net.usd : row.net.htg) < 0 ? "text-failure" : ""}`}
                    >
                      <MoneyCell money={row.net} currency={row.currency} />
                    </Td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : search ? (
            <p className="text-[1.8rem] text-neutral-600 leading-10 text-center mt-16">
              {t("activities.no_results", { term: search })}
            </p>
          ) : (
            <div className="flex flex-col gap-12 items-center mt-8 self-center w-full">
              <div className="rounded-full bg-neutral-100 p-6 w-fit">
                <div className="flex items-center rounded-full bg-neutral-200 p-8 w-fit justify-center">
                  <Image src={Money} alt="no sales" width={50} height={50} />
                </div>
              </div>
              <p className="max-w-172 text-[1.8rem] text-neutral-600 leading-10 text-center">
                {t("activities.empty")}
              </p>
            </div>
          )}
        </div>

        {meta.lastPage > 1 && (
          <Pagination
            currentPage={meta.currentPage}
            firstPage={meta.firstPage}
            lastPage={meta.lastPage}
            hrefFor={(page) => hrefFor({ page })}
          />
        )}
      </div>

      <Drawer
        direction="right"
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      >
        {selectedId && (
          <FinanceActivityDrawer
            activityId={selectedId}
            period={period}
            locale={locale}
          />
        )}
      </Drawer>
    </div>
  );
}

function Pagination({
  currentPage,
  firstPage,
  lastPage,
  hrefFor,
}: {
  currentPage: number;
  firstPage: number;
  lastPage: number;
  hrefFor: (page: number) => string;
}) {
  const hasPrev = currentPage > firstPage;
  const hasNext = currentPage < lastPage;
  const pages: number[] = [];
  for (
    let i = Math.max(firstPage, currentPage - 2);
    i <= Math.min(lastPage, currentPage + 2);
    i++
  )
    pages.push(i);

  const circle =
    "w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full";

  return (
    <div className="flex items-center gap-2 pb-4">
      {hasPrev ? (
        <Link
          href={hrefFor(currentPage - 1)}
          className={`${circle} hover:bg-neutral-100 transition-colors`}
        >
          <ArrowLeft2 size="20" color="#E45B00" variant="Bulk" />
        </Link>
      ) : (
        <span className={`${circle} opacity-30 cursor-not-allowed`}>
          <ArrowLeft2 size="20" color="#E45B00" variant="Bulk" />
        </span>
      )}
      {pages[0] > firstPage && (
        <>
          <Link
            href={hrefFor(firstPage)}
            className={`${circle} text-[1.3rem] font-medium text-neutral-600 hover:bg-neutral-100 transition-colors`}
          >
            {firstPage}
          </Link>
          {pages[0] > firstPage + 1 && (
            <span className="text-[1.3rem] text-neutral-400 px-1">…</span>
          )}
        </>
      )}
      {pages.map((page) => (
        <Link
          key={page}
          href={hrefFor(page)}
          className={`${circle} text-[1.3rem] font-medium transition-colors ${
            page === currentPage
              ? "text-primary-500 pointer-events-none"
              : "text-neutral-600 hover:text-primary-500"
          }`}
        >
          {page}
        </Link>
      ))}
      {pages.at(-1)! < lastPage && (
        <>
          {pages.at(-1)! < lastPage - 1 && (
            <span className="text-[1.3rem] text-neutral-400 px-1">…</span>
          )}
          <Link
            href={hrefFor(lastPage)}
            className={`${circle} text-[1.3rem] font-medium text-neutral-600 hover:bg-neutral-100 transition-colors`}
          >
            {lastPage}
          </Link>
        </>
      )}
      {hasNext ? (
        <Link
          href={hrefFor(currentPage + 1)}
          className={`${circle} hover:bg-neutral-100 transition-colors`}
        >
          <ArrowRight2 size="20" color="#E45B00" variant="Bulk" />
        </Link>
      ) : (
        <span className={`${circle} opacity-30 cursor-not-allowed`}>
          <ArrowRight2 size="20" color="#E45B00" variant="Bulk" />
        </span>
      )}
    </div>
  );
}

/**
 * An amount in the activity's own currency. A USD activity also gets its HTG
 * equivalent underneath, the same way the summary cards do.
 */
function MoneyCell({
  money,
  currency,
}: {
  money: MoneyAmount;
  currency: string;
}) {
  return (
    <span className="flex flex-col">
      <span>{formatMoney(money, currency)}</span>
      {currency === "USD" && (
        <span className="text-[1.2rem] text-neutral-500 font-normal leading-6">
          {formatAmount(money.htg)} HTG
        </span>
      )}
    </span>
  );
}

function Th({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <TableHead
      className={`font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase ${className}`}
    >
      {children}
    </TableHead>
  );
}

function Td({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <TableCell
      className={`text-[1.5rem] py-6 leading-8 text-neutral-900 ${className}`}
    >
      {children}
    </TableCell>
  );
}
