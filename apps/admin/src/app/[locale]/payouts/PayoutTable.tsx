"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { ArrowRight, DollarCircle, MoreCircle } from "iconsax-reactjs";
import FilterPill from "@/components/shared/FilterPill";
import SearchField from "@/components/shared/SearchField";
import { Drawer } from "@/components/ui/drawer";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import PayoutDrawer, { amountLabel, bankLabel, PAYOUT_BADGE, type PayoutRow } from "./PayoutDrawer";

export type PayoutPage = {
  kind: "organisation" | "user";
  data: PayoutRow[];
  meta: { total: number };
};

const STATUS_OPTIONS = {
  requests: { organisation: ["PENDING", "APPROVED"], user: ["PENDING"] },
  history: { organisation: ["SUCCESSFUL", "FAILED"], user: ["ACCEPTED", "REJECTED"] },
} as const;

/**
 * One of Figma's two tables ("Payout request" / "Payout history"): an
 * Organisations | Attendees switch (user decision), status + search pills,
 * the latest 5 rows and "View all" to the full list. A row opens the payout
 * drawer; when it closes — settled or not — the table and the tiles reload.
 */
export default function PayoutTable({
  scope,
  initial,
  refreshKey,
  onChanged,
}: {
  scope: "requests" | "history";
  initial: PayoutPage | null;
  refreshKey: number;
  onChanged: () => void;
}) {
  const t = useTranslations("PayoutsList");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const [kind, setKind] = useState<"organisation" | "user">("organisation");
  const [status, setStatus] = useState("all");
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState<PayoutPage | null>(initial);
  const [selected, setSelected] = useState<PayoutRow | null>(null);
  const token = session?.user.accessToken;

  // What is asked for vs what is on screen: the server sent the default view,
  // anything else is fetched, and "loading" is simply the two differing.
  const wanted = JSON.stringify({ kind, status, query, refreshKey });
  const [loaded, setLoaded] = useState(() =>
    JSON.stringify({ kind: "organisation", status: "all", query: "", refreshKey: 0 }),
  );
  const loading = wanted !== loaded;

  useEffect(() => {
    if (!token || wanted === loaded) return;
    let cancelled = false;
    const params = new URLSearchParams({ kind, scope, limit: "5" });
    if (status !== "all") params.set("status", status);
    if (query) params.set("search", query);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/payouts-list?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json())
      .catch(() => null)
      .then((data) => {
        if (cancelled) return;
        if (data?.status === "success") setPage(data.payouts);
        setLoaded(wanted);
      });
    return () => {
      cancelled = true;
    };
  }, [token, wanted, loaded, kind, scope, status, query]);

  // Search follows typing, 300 ms after the last key.
  useEffect(() => {
    const id = setTimeout(() => setQuery(term.trim()), 300);
    return () => clearTimeout(id);
  }, [term]);

  const rows = page?.kind === kind ? page.data : [];
  const filtering = status !== "all" || Boolean(query);
  const head = "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase text-left";
  const cell = "py-6 pr-4 text-[1.5rem] leading-8 text-deep-100";
  const badge = "py-[0.3rem] px-2 rounded-[30px] text-[1.1rem] font-bold leading-6 uppercase whitespace-nowrap";
  const pill = (value: "organisation" | "user") => (
    <button
      key={value}
      type="button"
      onClick={() => {
        setKind(value);
        setStatus("all");
      }}
      className={cn(
        "px-[1.5rem] py-[0.5rem] rounded-[30px] text-[1.4rem] leading-8 cursor-pointer transition-colors",
        kind === value ? "bg-black text-white" : "text-neutral-700 hover:text-deep-100",
      )}
    >
      {t(`kinds.${value}`)}
    </button>
  );

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <h4 className="font-primary font-medium text-[1.8rem] leading-10 text-black">
            {t(`${scope}.title`)}
          </h4>
          <div className="inline-flex items-center bg-neutral-100 rounded-[30px] p-[0.5rem]">
            {pill("organisation")}
            {pill("user")}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <FilterPill
            label={t("filters.status_label")}
            value={status}
            defaultValue="all"
            placeholder={t("filters.status")}
            options={[
              { value: "all", label: t("filters.status") },
              ...STATUS_OPTIONS[scope][kind].map((s) => ({ value: s, label: t(`status_options.${s}`) })),
            ]}
            onChange={setStatus}
            pending={loading}
          />
          <SearchField
            value={term}
            onChange={setTerm}
            placeholder={t("filters.search")}
            className="flex w-full lg:w-[26rem]"
          />
        </div>
      </div>

      <div className={cn("overflow-x-auto transition-opacity", loading && "opacity-60")}>
        <table className="w-full min-w-[72rem] border-collapse">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className={head}>{t("table.id")}</th>
              <th className={head}>{t("table.bank")}</th>
              <th className={head}>{t("table.account")}</th>
              <th className={head}>{t("table.amount")}</th>
              <th className={head}>
                {scope === "requests" ? t("table.request_status") : t("table.transaction_status")}
              </th>
              <th className={head}>
                <span className="sr-only">{t("table.actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => setSelected(row)}
                className="border-b border-neutral-100 cursor-pointer hover:bg-neutral-50 transition-colors"
              >
                <td className={cn(cell, "whitespace-nowrap")} title={row.id}>
                  #{row.id.slice(0, 8).toUpperCase()}
                </td>
                <td className={cell}>
                  <span className="block max-w-[20rem] truncate">{bankLabel(row, t)}</span>
                </td>
                <td className={cn(cell, "whitespace-nowrap")}>{row.accountNumber ?? "-"}</td>
                <td className={cn(cell, "whitespace-nowrap")}>{amountLabel(row, locale)}</td>
                <td className="py-6 pr-4">
                  <span className={cn(badge, PAYOUT_BADGE[row.status] ?? PAYOUT_BADGE.PENDING)}>
                    {t(`status.${row.status}`)}
                  </span>
                </td>
                <td className="py-6 text-right">
                  <span
                    aria-hidden
                    className="relative w-[2rem] h-[2rem] shrink-0 rounded-full bg-neutral-100 inline-flex items-center justify-center"
                  >
                    <MoreCircle size="10" variant="Bulk" color="#737C8A" />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 &&
        (filtering ? (
          <p className="text-[1.6rem] text-neutral-600 leading-10 text-center py-10">
            {t("no_results")}
          </p>
        ) : (
          <div className="flex flex-col items-center gap-8 py-10">
            <div className="rounded-full bg-neutral-100 p-6">
              <div className="rounded-full bg-neutral-200 p-8">
                <DollarCircle size="44" variant="Bulk" color="#454A53" />
              </div>
            </div>
            <p className="max-w-[44rem] text-[1.6rem] text-neutral-600 leading-9 text-center">
              {t(`${scope}.empty`)}
            </p>
          </div>
        ))}

      {(page?.meta.total ?? 0) > rows.length && (
        <Link
          href={`/payouts/requests?scope=${scope}&tab=${kind}`}
          className="self-end inline-flex items-center gap-2 text-[1.4rem] font-medium text-primary-500 hover:underline"
        >
          {t("view_all")}
          <ArrowRight size="16" color="#E45B00" />
        </Link>
      )}

      <Drawer
        direction="right"
        open={selected !== null}
        onOpenChange={(open) => {
          if (open) return;
          setSelected(null);
          // Whatever happened in the drawer, show the current state.
          onChanged();
          router.refresh();
        }}
      >
        {selected && (
          <PayoutDrawer
            row={selected}
            onSettled={() => {
              setSelected(null);
              onChanged();
              router.refresh();
            }}
          />
        )}
      </Drawer>
    </section>
  );
}
