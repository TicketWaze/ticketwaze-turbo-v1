"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { Add, Warning2 } from "iconsax-reactjs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import UnauthorizedView from "@/components/shared/UnauthorizedView";
import { usePermissions } from "@/hooks/usePermissions";
import formatDate from "@/lib/FormatDate";
import { DeleteCampaignAction } from "@/actions/Campaign";

export type CampaignStatus =
  | "draft"
  | "queued"
  | "sending"
  | "sent"
  | "failed"
  | "cancelled";

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

/** The pill each status shows as. Colours follow the ones used on payouts. */
const STATUS_STYLES: Record<CampaignStatus, string> = {
  draft: "bg-neutral-100 text-neutral-700",
  queued: "bg-primary-50 text-primary-600",
  sending: "bg-primary-50 text-primary-600",
  sent: "bg-success/10 text-success",
  failed: "bg-failure/10 text-failure",
  cancelled: "bg-neutral-100 text-neutral-500",
};

export default function EmailsPageContent({
  campaigns,
  failed,
  accessToken,
}: Props) {
  const t = useTranslations("Emails");
  const locale = useLocale();
  const router = useRouter();
  const { can, isLoading } = usePermissions();

  const [tab, setTab] = useState<Tab>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <LoadingCircleSmall />
      </div>
    );
  }
  if (!can("campaigns.view")) return <UnauthorizedView />;

  const displayed =
    tab === "draft"
      ? campaigns.filter((c) => c.status === "draft")
      : tab === "sent"
        ? campaigns.filter((c) => c.status !== "draft")
        : campaigns;

  const draftCount = campaigns.filter((c) => c.status === "draft").length;

  async function handleDelete(campaignId: string) {
    setDeletingId(campaignId);
    try {
      const result = await DeleteCampaignAction(campaignId, {
        accessToken,
        locale,
      });
      if ("status" in result) {
        toast.success(t("list.deleted"));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="overflow-y-scroll flex flex-col gap-8">
      {/* Topbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="font-medium font-primary text-[2.6rem] leading-12 text-black">
            {t("title")}
          </h3>
          <p className="text-[1.4rem] leading-8 text-neutral-600">
            {t("subtitle")}
          </p>
        </div>
        {can("campaigns.create") && (
          <Link
            href="/emails/new"
            className="flex items-center justify-center gap-2 px-6 py-[0.8rem] rounded-[3rem] bg-primary-500 text-white text-[1.4rem] leading-8 font-medium cursor-pointer hover:bg-primary-500/80 transition-colors"
          >
            <Add size="18" color="#fff" />
            {t("list.new")}
          </Link>
        )}
      </div>

      {failed && (
        <div className="flex items-center gap-4 px-8 py-6 rounded-[10px] bg-failure/5">
          <Warning2 size="20" color="#de0028" variant="Bulk" />
          <p className="text-[1.4rem] leading-8 text-failure">
            {t("list.loadFailed")}
          </p>
        </div>
      )}

      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
        <TabsList className="w-full lg:w-fit">
          <TabsTrigger value="all">
            {t("list.tabs.all")} ({campaigns.length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            {t("list.tabs.drafts")} ({draftCount})
          </TabsTrigger>
          <TabsTrigger value="sent">
            {t("list.tabs.sent")} ({campaigns.length - draftCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-[1.6rem] leading-8 text-neutral-700 font-medium">
            {t("list.empty.title")}
          </p>
          <p className="text-[1.4rem] leading-8 text-neutral-500 max-w-[420px]">
            {t("list.empty.description")}
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("list.columns.name")}</TableHead>
              <TableHead>{t("list.columns.status")}</TableHead>
              <TableHead>{t("list.columns.recipients")}</TableHead>
              <TableHead>{t("list.columns.created")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayed.map((campaign) => (
              <TableRow key={campaign.emailCampaignId}>
                <TableCell>
                  <Link
                    href={`/emails/${campaign.emailCampaignId}`}
                    className="flex flex-col gap-1 hover:text-primary-500 transition-colors"
                  >
                    <span className="font-medium text-[1.5rem] leading-8">
                      {campaign.name}
                    </span>
                    <span className="text-[1.3rem] leading-6 text-neutral-500">
                      {campaign.subjectFr}
                    </span>
                  </Link>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex px-4 py-[0.2rem] rounded-[3rem] text-[1.3rem] leading-8 font-medium ${STATUS_STYLES[campaign.status]}`}
                  >
                    {t(`status.${campaign.status}`)}
                  </span>
                </TableCell>
                <TableCell>
                  {campaign.status === "draft" ? (
                    <span className="text-neutral-500">—</span>
                  ) : (
                    <span className="text-[1.4rem] leading-8">
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
                    </span>
                  )}
                </TableCell>
                <TableCell>{formatDate(campaign.createdAt, locale, "local")}</TableCell>
                <TableCell>
                  {/* Only a draft is deletable — a sent campaign is the record
                      of who received what, and the API refuses to delete it. */}
                  {campaign.status === "draft" && can("campaigns.delete") && (
                    <button
                      onClick={() => handleDelete(campaign.emailCampaignId)}
                      disabled={deletingId === campaign.emailCampaignId}
                      className="text-[1.4rem] leading-8 text-failure hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {deletingId === campaign.emailCampaignId ? (
                        <LoadingCircleSmall />
                      ) : (
                        t("list.delete")
                      )}
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
