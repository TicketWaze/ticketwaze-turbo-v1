"use client";
import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Messages2 } from "iconsax-reactjs";
import { usePathname, useRouter } from "@/i18n/navigation";
import { PAGE_SCROLLER } from "@/components/shared/PageTitle";
import SettingsHeader from "@/components/shared/SettingsHeader";
import FilterPill from "@/components/shared/FilterPill";
import SearchField from "@/components/shared/SearchField";
import TablePagination from "@/components/shared/TablePagination";
import { Reveal } from "@/components/shared/motion";
import {
  Badge,
  EmptyState,
  RowMore,
  TABLE_CELL,
  TABLE_HEAD,
  TABLE_ROW,
  TableFrame,
} from "@/components/shared/DataTable";
import formatDateTime from "@/lib/formatDateTime";
import { cn } from "@/lib/utils";

export type SupportThread = {
  threadId: string;
  fullName: string;
  email: string;
  subject: string;
  accessToken: string;
  resolved: boolean;
  accepted: boolean;
  supportNotes: string | null;
  appLanguage: string;
  createdAt: string;
  updatedAt: string;
};

export type SupportMessage = {
  messageId: string;
  sender: "customer" | "admin";
  message: string;
  createdAt: string;
};

export type SupportThreadsResponse = {
  data: SupportThread[];
  meta: { total: number; perPage: number; currentPage: number; lastPage: number };
};

/**
 * Settings → Live Chat: the chat threads, most recently active first. Open
 * first (the default filter), a status pill and a search over the visitor and
 * subject; a row opens the conversation. An open thread nobody has picked up
 * yet reads "Waiting".
 */
export default function SupportPageContent({
  threads,
  filters,
}: {
  threads: SupportThreadsResponse;
  filters: { resolved: string; search: string };
}) {
  const t = useTranslations("Support");
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

  // Search follows typing, 300 ms after the last key.
  useEffect(() => {
    if (term.trim() === filters.search) return;
    const id = setTimeout(() => update({ search: term.trim() || null }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  const rows = threads.data;
  const { meta } = threads;
  const filtering = filters.resolved !== "false" || Boolean(filters.search);

  return (
    <div className={cn(PAGE_SCROLLER, "gap-0")} aria-busy={pending}>
      <SettingsHeader
        title={t("title")}
        actions={
          <>
            <FilterPill
              label={t("filters.label")}
              value={filters.resolved}
              defaultValue="false"
              options={[
                { value: "false", label: t("filters.open") },
                { value: "true", label: t("filters.resolved") },
                { value: "all", label: t("filters.all") },
              ]}
              onChange={(v) => update({ resolved: v === "false" ? null : v })}
              pending={pending}
            />
            <SearchField
              value={term}
              onChange={setTerm}
              placeholder={t("filters.search")}
              className="flex w-full lg:w-[26rem]"
            />
          </>
        }
      />

      <Reveal className="flex flex-col gap-6">
        <TableFrame minWidth="72rem" pending={pending}>
          <thead>
            <tr className="border-b border-neutral-100">
              <th className={TABLE_HEAD}>{t("table.sender")}</th>
              <th className={TABLE_HEAD}>{t("table.subject")}</th>
              <th className={TABLE_HEAD}>{t("table.status")}</th>
              <th className={TABLE_HEAD}>{t("table.date")}</th>
              <th className={TABLE_HEAD}>
                <span className="sr-only">{t("table.actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((thread) => (
              <tr
                key={thread.threadId}
                className={TABLE_ROW}
                onClick={() => router.push(`/support/${thread.threadId}`)}
              >
                <td className={TABLE_CELL}>
                  <span className="flex flex-col max-w-[24rem]">
                    <span className="truncate font-medium">{thread.fullName}</span>
                    <span className="truncate text-[1.3rem] text-neutral-600">{thread.email}</span>
                  </span>
                </td>
                <td className={TABLE_CELL}>
                  <span className="block max-w-[32rem] truncate" title={thread.subject}>
                    {thread.subject}
                  </span>
                </td>
                <td className="py-6 pr-4">
                  <ThreadBadge thread={thread} />
                </td>
                <td className={cn(TABLE_CELL, "whitespace-nowrap")}>
                  {formatDateTime(thread.updatedAt, locale)}
                </td>
                <td className="py-6 text-right">
                  <RowMore />
                </td>
              </tr>
            ))}
          </tbody>
        </TableFrame>

        {rows.length === 0 && (
          <EmptyState
            Icon={Messages2}
            filtered={filtering}
            text={filtering ? t("no_results") : t("empty")}
          />
        )}

        {meta.lastPage > 1 && (
          <TablePagination
            page={meta.currentPage}
            count={meta.lastPage}
            onChange={(page) => update({ page: page > 1 ? String(page) : null })}
            prevLabel={t("prev")}
            nextLabel={t("next")}
          />
        )}
      </Reveal>
    </div>
  );
}

export function ThreadBadge({ thread }: { thread: Pick<SupportThread, "resolved" | "accepted"> }) {
  const t = useTranslations("Support.status");
  if (thread.resolved) return <Badge tone="success">{t("resolved")}</Badge>;
  if (!thread.accepted) return <Badge tone="warning">{t("waiting")}</Badge>;
  return <Badge tone="primary">{t("open")}</Badge>;
}
