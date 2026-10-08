"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Add, MoreCircle, Sms, Warning2 } from "iconsax-reactjs";
import { Link, useRouter } from "@/i18n/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import UnauthorizedView from "@/components/shared/UnauthorizedView";
import { PAGE_SCROLLER } from "@/components/shared/PageTitle";
import SettingsHeader from "@/components/shared/SettingsHeader";
import FilterPill from "@/components/shared/FilterPill";
import SearchField from "@/components/shared/SearchField";
import TablePagination from "@/components/shared/TablePagination";
import { Reveal } from "@/components/shared/motion";
import {
  Badge,
  EmptyState,
  HEADER_PILL,
  PILL_TONE,
  TABLE_CELL,
  TABLE_HEAD,
  TABLE_ROW,
  TableFrame,
  type BadgeTone,
} from "@/components/shared/DataTable";
import { usePermissions } from "@/hooks/usePermissions";
import formatDate from "@/lib/FormatDate";
import { cn } from "@/lib/utils";
import { DeleteCampaignAction } from "@/actions/Campaign";

export type CampaignStatus = "draft" | "queued" | "sending" | "sent" | "failed" | "cancelled";

export type CampaignSummary = {
  emailCampaignId: string;
  name: string;
  subjectFr: string;
  status: CampaignStatus;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  queuedAt: string | null;
};

type Props = {
  campaigns: CampaignSummary[];
  failed: boolean;
  accessToken: string;
};

type Tab = "all" | "draft" | "sent";

const PER_PAGE = 15;

export const CAMPAIGN_TONE: Record<CampaignStatus, BadgeTone> = {
  draft: "neutral",
  queued: "primary",
  sending: "primary",
  sent: "success",
  failed: "danger",
  cancelled: "neutral",
};

/**
 * Settings → Emails: the broadcast campaigns, newest first. Drafts / sent
 * pill, a search over name and subject, 15 a page. A row opens the campaign
 * (the composer for a draft, the report once queued); a draft's ⋯ deletes it.
 */
export default function EmailsPageContent({ campaigns, failed, accessToken }: Props) {
  const t = useTranslations("Emails");
  const locale = useLocale();
  const router = useRouter();
  const { can, isLoading } = usePermissions();

  const [tab, setTab] = useState<Tab>("all");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <LoadingCircleSmall />
      </div>
    );
  }
  if (!can("campaigns.view")) return <UnauthorizedView />;

  const draftCount = campaigns.filter((c) => c.status === "draft").length;
  const query = term.trim().toLowerCase();
  const displayed = campaigns
    .filter((c) =>
      tab === "draft" ? c.status === "draft" : tab === "sent" ? c.status !== "draft" : true,
    )
    .filter(
      (c) =>
        !query ||
        c.name.toLowerCase().includes(query) ||
        c.subjectFr.toLowerCase().includes(query),
    );
  const pageCount = Math.max(1, Math.ceil(displayed.length / PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const rows = displayed.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const filtering = tab !== "all" || Boolean(query);

  async function handleDelete(campaignId: string) {
    setMenuId(null);
    setDeletingId(campaignId);
    try {
      const result = await DeleteCampaignAction(campaignId, { accessToken, locale });
      if ("status" in result) {
        toast.success(t("list.deleted"));
        router.refresh();
      } else toast.error(result.error);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className={cn(PAGE_SCROLLER, "gap-0")}>
      <SettingsHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          can("campaigns.create") && (
            <Link href="/emails/new" className={cn(HEADER_PILL, PILL_TONE.primary, "gap-2")}>
              <Add size="18" color="#fff" />
              {t("list.new")}
            </Link>
          )
        }
      />

      {failed && (
        <div className="flex items-center gap-4 px-8 py-6 mb-8 rounded-[1rem] bg-failure/5">
          <Warning2 size="20" color="#de0028" variant="Bulk" />
          <p className="text-[1.4rem] leading-8 text-failure">{t("list.loadFailed")}</p>
        </div>
      )}

      <Reveal className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h4 className="font-primary font-medium text-[1.8rem] leading-10 text-black">
            {t("list.title")}
          </h4>
          <div className="flex flex-wrap items-center gap-4">
            <FilterPill
              label={t("list.status_label")}
              value={tab}
              defaultValue="all"
              options={[
                { value: "all", label: `${t("list.tabs.all")} (${campaigns.length})` },
                { value: "draft", label: `${t("list.tabs.drafts")} (${draftCount})` },
                { value: "sent", label: `${t("list.tabs.sent")} (${campaigns.length - draftCount})` },
              ]}
              onChange={(v) => {
                setTab(v as Tab);
                setPage(1);
              }}
            />
            <SearchField
              value={term}
              onChange={(v) => {
                setTerm(v);
                setPage(1);
              }}
              placeholder={t("list.search")}
              className="flex w-full lg:w-[26rem]"
            />
          </div>
        </div>

        <TableFrame minWidth="72rem">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className={TABLE_HEAD}>{t("list.columns.name")}</th>
              <th className={TABLE_HEAD}>{t("list.columns.status")}</th>
              <th className={TABLE_HEAD}>{t("list.columns.recipients")}</th>
              <th className={TABLE_HEAD}>{t("list.columns.created")}</th>
              <th className={TABLE_HEAD}>
                <span className="sr-only">{t("list.columns.actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((campaign) => {
              const deletable = campaign.status === "draft" && can("campaigns.delete");
              return (
                <tr
                  key={campaign.emailCampaignId}
                  className={TABLE_ROW}
                  onClick={() => router.push(`/emails/${campaign.emailCampaignId}`)}
                >
                  <td className={TABLE_CELL}>
                    <span className="flex flex-col max-w-[34rem]">
                      <span className="truncate font-medium">{campaign.name}</span>
                      <span className="truncate text-[1.3rem] text-neutral-600">
                        {campaign.subjectFr}
                      </span>
                    </span>
                  </td>
                  <td className="py-6 pr-4">
                    <Badge tone={CAMPAIGN_TONE[campaign.status]}>
                      {t(`status.${campaign.status}`)}
                    </Badge>
                  </td>
                  <td className={cn(TABLE_CELL, "whitespace-nowrap")}>
                    {campaign.status === "draft" ? (
                      <span className="text-neutral-500">—</span>
                    ) : (
                      <>
                        {t("list.sentOf", {
                          sent: campaign.sentCount,
                          total: campaign.totalRecipients,
                        })}
                        {campaign.failedCount > 0 && (
                          <span className="text-failure">
                            {" "}
                            · {t("list.failedCount", { count: campaign.failedCount })}
                          </span>
                        )}
                      </>
                    )}
                  </td>
                  <td className={cn(TABLE_CELL, "whitespace-nowrap")}>
                    {formatDate(campaign.createdAt, locale, "local")}
                  </td>
                  <td className="py-6 text-right" onClick={(e) => deletable && e.stopPropagation()}>
                    {/* Only a draft is deletable — a sent campaign is the
                        record of who received what, and the API refuses. */}
                    {deletingId === campaign.emailCampaignId ? (
                      <LoadingCircleSmall />
                    ) : deletable ? (
                      <Popover
                        open={menuId === campaign.emailCampaignId}
                        onOpenChange={(open) => setMenuId(open ? campaign.emailCampaignId : null)}
                      >
                        <PopoverTrigger
                          aria-label={t("list.columns.actions")}
                          className="relative w-[2rem] h-[2rem] rounded-full bg-neutral-100 inline-flex items-center justify-center cursor-pointer after:absolute after:-inset-[0.8rem] after:content-['']"
                        >
                          <MoreCircle size="10" variant="Bulk" color="#737C8A" />
                        </PopoverTrigger>
                        <PopoverContent
                          align="end"
                          className="w-[20rem] p-[.6rem] bg-white border border-neutral-100 rounded-[1rem] shadow-[0px_5px_10px_0px_rgba(0,0,0,0.1)]"
                        >
                          <Link
                            href={`/emails/${campaign.emailCampaignId}`}
                            className="block px-[1rem] py-[.8rem] rounded-[.75rem] text-[1.4rem] text-deep-100 hover:bg-neutral-100"
                          >
                            {t("list.open")}
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(campaign.emailCampaignId)}
                            className="w-full text-left px-[1rem] py-[.8rem] rounded-[.75rem] text-[1.4rem] text-failure hover:bg-failure/5 cursor-pointer"
                          >
                            {t("list.delete")}
                          </button>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <span
                        aria-hidden
                        className="w-[2rem] h-[2rem] rounded-full bg-neutral-100 inline-flex items-center justify-center"
                      >
                        <MoreCircle size="10" variant="Bulk" color="#737C8A" />
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableFrame>

        {displayed.length === 0 && (
          <EmptyState
            Icon={Sms}
            filtered={filtering}
            text={filtering ? t("list.no_results") : t("list.empty.description")}
          />
        )}

        {pageCount > 1 && (
          <TablePagination
            page={currentPage}
            count={pageCount}
            onChange={setPage}
            prevLabel={t("list.prev")}
            nextLabel={t("list.next")}
          />
        )}
      </Reveal>
    </div>
  );
}
