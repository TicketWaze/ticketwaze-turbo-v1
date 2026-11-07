"use client";
import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Briefcase } from "iconsax-reactjs";
import { formatMoney } from "@ticketwaze/currency";
import { PAGE_SCROLLER } from "@/components/shared/PageTitle";
import FilterPill from "@/components/shared/FilterPill";
import SearchField from "@/components/shared/SearchField";
import TablePagination from "@/components/shared/TablePagination";
import { Reveal } from "@/components/shared/motion";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ORDER_BADGE } from "@/components/shared/TransactionDetailsDrawer";
import { Metric, Unit } from "../analytics/parts";
import PartnerManager, { type ManagedPartner } from "./PartnerManager";

type Money = { htg: number; usd: number };

type Partner = {
  partnerId: string;
  slug: string;
  name: string;
  active: boolean;
  paid: number;
  unnotified: number;
  collected: Money;
  byProvider: { moncashHtg: number; stripeUsd: number };
};

type PartnerPayment = {
  id: string;
  partner: { slug: string; name: string };
  reference: string;
  purpose: string;
  provider: "moncash" | "stripe";
  status: (typeof STATUSES)[number];
  amount: number;
  fee: number;
  currency: "HTG" | "USD";
  transactionId: string | null;
  payerName: string | null;
  payerEmail: string | null;
  paidAt: string | null;
  notifiedAt: string | null;
  createdAt: string;
};

export type PartnersData = {
  partners: Partner[];
  payments: {
    data: PartnerPayment[];
    meta: { total: number; perPage: number; currentPage: number; lastPage: number };
  };
};

const STATUSES = ["SUCCESSFUL", "PENDING", "FAILED", "CANCELLED"] as const;

const BADGE: Record<string, string> = { ...ORDER_BADGE, CANCELLED: ORDER_BADGE.RETURNED };

/**
 * Admin › Partners (Ticketwaze Pay): what Ticketwaze collected on behalf of
 * each partner — BTI's admission fees first. This money is owed to the
 * partner, so it is never counted in Payments, Finance or Analytics; one tile
 * per partner, then every payment attempt with the same filters as Payments.
 * See the API's services/admin_partner_payments.ts.
 *
 * With `partners.manage`, the partners' settings sit between the two: keys,
 * webhook, pause, delete (`PartnerManager`). `managed` is null without it.
 */
export default function PartnersPageContent({
  data,
  managed,
  filters,
}: {
  data: PartnersData | null;
  managed: ManagedPartner[] | null;
  filters: { partner: string | null; status: string | null; search: string };
}) {
  const t = useTranslations("PartnersList");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [term, setTerm] = useState(filters.search);

  function update(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    if (!("page" in changes)) params.delete("page");
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  useEffect(() => {
    if (term.trim() === filters.search) return;
    const id = setTimeout(() => update({ search: term.trim() || null }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  const partners = data?.partners ?? [];
  const rows = data?.payments.data ?? [];
  const meta = data?.payments.meta;
  const filtering = Boolean(filters.partner || filters.status || filters.search);
  const number = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 2 });
  const date = (iso: string) =>
    new Date(iso).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });

  const head = "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase text-left";
  const cell = "py-6 pr-4 text-[1.5rem] leading-8 text-deep-100";
  const badge =
    "py-[0.3rem] px-2 rounded-[30px] text-[1.1rem] font-bold leading-6 uppercase whitespace-nowrap";

  return (
    <div className={cn(PAGE_SCROLLER, "gap-0")} aria-busy={pending}>
      <div className="sticky top-0 z-20 bg-white pb-8 flex flex-col gap-2">
        <h3 className="font-primary font-medium text-[2.6rem] leading-12 text-black">
          {t("title")}
        </h3>
        <p className="text-[1.4rem] leading-8 text-neutral-600 max-w-[64rem]">{t("intro")}</p>
      </div>

      {/* One tile per partner: what is owed to it. */}
      <Reveal className="grid grid-cols-1 lg:grid-cols-3 border-b border-neutral-100">
        {partners.map((partner, i) => (
          <div
            key={partner.partnerId}
            className={cn("py-6 pr-6 lg:pr-10 border-neutral-100", i > 0 && "lg:pl-10 lg:border-l")}
          >
            <Metric
              label={t("collected", { name: partner.name })}
              trend={
                partner.active ? null : (
                  <span className={cn(badge, BADGE.CANCELLED)}>{t("inactive")}</span>
                )
              }
              note={t("breakdown", {
                count: partner.paid,
                moncash: formatMoney(partner.byProvider.moncashHtg, "HTG", locale),
                stripe: formatMoney(partner.byProvider.stripeUsd, "USD", locale),
              })}
            >
              {number(partner.collected.htg)} <Unit>HTG</Unit>
            </Metric>
            {partner.unnotified > 0 && (
              <p className="mt-3 text-[1.3rem] leading-6 text-[#C98A00]">
                {t("unnotified", { count: partner.unnotified })}
              </p>
            )}
          </div>
        ))}
      </Reveal>

      {managed && (
        <Reveal delay={0.03}>
          <PartnerManager initial={managed} />
        </Reveal>
      )}

      <Reveal delay={0.05} className="flex flex-col gap-6 pt-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h4 className="font-primary font-medium text-[1.8rem] leading-10 text-black">
            {t("list.title")}
          </h4>
          <div className="flex flex-wrap items-center gap-4">
            {partners.length > 1 && (
              <FilterPill
                label={t("filters.partner_label")}
                value={filters.partner ?? "all"}
                defaultValue="all"
                placeholder={t("filters.partner")}
                options={[
                  { value: "all", label: t("filters.partner") },
                  ...partners.map((p) => ({ value: p.slug, label: p.name })),
                ]}
                onChange={(v) => update({ partner: v === "all" ? null : v })}
                pending={pending}
              />
            )}
            <FilterPill
              label={t("filters.status_label")}
              value={filters.status ?? "all"}
              defaultValue="all"
              placeholder={t("filters.status")}
              options={[
                { value: "all", label: t("filters.status") },
                ...STATUSES.map((s) => ({ value: s, label: t(`filters.${s}`) })),
              ]}
              onChange={(v) => update({ status: v === "all" ? null : v })}
              pending={pending}
            />
            <SearchField
              value={term}
              onChange={setTerm}
              placeholder={t("filters.search")}
              className="flex w-full lg:w-[26rem]"
            />
          </div>
        </div>

        <div className={cn("overflow-x-auto transition-opacity", pending && "opacity-60")}>
          <table className="w-full min-w-[80rem] border-collapse">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className={head}>{t("list.table.reference")}</th>
                <th className={head}>{t("list.table.partner")}</th>
                <th className={head}>{t("list.table.payer")}</th>
                <th className={head}>{t("list.table.provider")}</th>
                <th className={head}>{t("list.table.amount")}</th>
                <th className={head}>{t("list.table.date")}</th>
                <th className={head}>{t("list.table.status")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-neutral-100">
                  <td className={cn(cell, "whitespace-nowrap")}>
                    <span className="flex flex-col">
                      {row.reference}
                      <span className="text-[1.2rem] leading-6 text-neutral-500">
                        {t.has(`purpose.${row.purpose}`) ? t(`purpose.${row.purpose}`) : row.purpose}
                      </span>
                    </span>
                  </td>
                  <td className={cell}>{row.partner.name}</td>
                  <td className={cell}>
                    <span className="flex flex-col max-w-[22rem]">
                      <span className="truncate">{row.payerName ?? "—"}</span>
                      {row.payerEmail && (
                        <span className="truncate text-[1.2rem] leading-6 text-neutral-500">
                          {row.payerEmail}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className={cell}>{t(`provider.${row.provider}`)}</td>
                  <td className={cn(cell, "whitespace-nowrap")}>
                    <span className="flex flex-col">
                      {formatMoney(row.amount, row.currency, locale)}
                      {row.fee > 0 && (
                        <span className="text-[1.2rem] leading-6 text-neutral-500">
                          {t("list.fee", { fee: formatMoney(row.fee, row.currency, locale) })}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className={cn(cell, "whitespace-nowrap")}>
                    {date(row.paidAt ?? row.createdAt)}
                  </td>
                  <td className="py-6 pr-4">
                    <span className="flex flex-col items-start gap-2">
                      <span className={cn(badge, BADGE[row.status] ?? BADGE.PENDING)}>
                        {t(`status.${row.status}`)}
                      </span>
                      {row.status === "SUCCESSFUL" && !row.notifiedAt && (
                        <span className="text-[1.1rem] leading-5 text-[#C98A00]">
                          {t("not_notified")}
                        </span>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 &&
          (filtering ? (
            <p className="text-[1.6rem] text-neutral-600 leading-10 text-center py-16">
              {t("list.no_results")}
            </p>
          ) : (
            <div className="flex flex-col items-center gap-10 py-16">
              <div className="rounded-full bg-neutral-100 p-6">
                <div className="rounded-full bg-neutral-200 p-8">
                  <Briefcase size="44" variant="Bulk" color="#454A53" />
                </div>
              </div>
              <p className="max-w-[44rem] text-[1.6rem] text-neutral-600 leading-9 text-center">
                {t("list.no_history")}
              </p>
            </div>
          ))}

        {meta && meta.lastPage > 1 && (
          <TablePagination
            page={meta.currentPage}
            count={meta.lastPage}
            onChange={(page) => update({ page: page > 1 ? String(page) : null })}
            prevLabel={t("list.prev")}
            nextLabel={t("list.next")}
          />
        )}
      </Reveal>
    </div>
  );
}
