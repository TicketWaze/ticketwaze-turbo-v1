"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { PAGE_SCROLLER } from "@/components/shared/PageTitle";
import SettingsHeader from "@/components/shared/SettingsHeader";
import { Reveal } from "@/components/shared/motion";
import {
  Badge,
  CARD,
  HEADER_PILL,
  PILL_TONE,
  TABLE_CELL,
  TABLE_HEAD,
  TableFrame,
} from "@/components/shared/DataTable";
import { cn } from "@/lib/utils";
import { Metric } from "../../analytics/parts";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { usePermissions } from "@/hooks/usePermissions";
import formatDate from "@/lib/FormatDate";
import { CancelCampaignAction, FetchCampaignAction } from "@/actions/Campaign";
import { CAMPAIGN_TONE, type CampaignStatus } from "./EmailsPageContent";

export interface CampaignDetail {
  emailCampaignId: string;
  name: string;
  subjectFr: string;
  subjectEn: string | null;
  bodyFr: string;
  bodyEn: string | null;
  status: CampaignStatus;
  toAllUsers: boolean;
  toAllOrganisations: boolean;
  manualEmails: string[];
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  lastError: string | null;
  createdAt: string;
  queuedAt: string | null;
  completedAt: string | null;
}

export interface CampaignProgress {
  pending: number;
  sent: number;
  failed: number;
  skipped: number;
}

export interface CampaignFailure {
  email: string;
  error: string;
  source: string;
}

interface Props {
  campaign: CampaignDetail;
  initialProgress: CampaignProgress;
  initialFailures: CampaignFailure[];
  accessToken: string;
}

/** A send moves in the background, so these two states are the ones worth watching. */
const IN_FLIGHT: CampaignStatus[] = ["queued", "sending"];

export default function CampaignReport({
  campaign: initialCampaign,
  initialProgress,
  initialFailures,
  accessToken,
}: Props) {
  const t = useTranslations("Emails");
  const locale = useLocale();
  const { can } = usePermissions();

  const [campaign, setCampaign] = useState(initialCampaign);
  const [progress, setProgress] = useState(initialProgress);
  const [failures, setFailures] = useState(initialFailures);
  const [isCancelling, setIsCancelling] = useState(false);

  const isRunning = IN_FLIGHT.includes(campaign.status);

  /**
   * Polls while the send is running, and only while it is running.
   *
   * POLLING RATHER THAN THE ADMIN SOCKET. The socket carries live support and
   * contact notifications, which are events a person triggers; a campaign's
   * progress is a counter that moves a few times a minute for an hour and then
   * stops. Pushing every batch's counters to every connected admin would put
   * far more on the socket than anyone is watching, and a five-second poll on a
   * page somebody has deliberately opened costs one query.
   */
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!isRunning) return;

    timerRef.current = setInterval(async () => {
      const result = await FetchCampaignAction(campaign.emailCampaignId, {
        accessToken,
        locale,
      });
      if ("error" in result) return;
      setCampaign(result.campaign as unknown as CampaignDetail);
      setProgress(result.progress);
      setFailures(result.failures);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, campaign.emailCampaignId, accessToken, locale]);

  async function handleCancel() {
    setIsCancelling(true);
    const result = await CancelCampaignAction(campaign.emailCampaignId, {
      accessToken,
      locale,
    });
    setIsCancelling(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(t("report.cancelled"));
    setCampaign({ ...campaign, status: "cancelled" });
  }

  const total =
    progress.pending + progress.sent + progress.failed + progress.skipped;
  const done = progress.sent + progress.failed + progress.skipped;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  const tiles = [
    { key: "recipients", value: total },
    { key: "delivered", value: progress.sent },
    { key: "failed", value: progress.failed, danger: true },
    { key: "skipped", value: progress.skipped },
  ];

  return (
    <div className={cn(PAGE_SCROLLER, "gap-0")}>
      <SettingsHeader
        title={campaign.name}
        description={campaign.subjectFr}
        back={{ href: "/emails", label: t("title") }}
        actions={
          <div className="flex items-center gap-[1rem] w-full lg:w-auto">
            <Badge tone={CAMPAIGN_TONE[campaign.status]}>{t(`status.${campaign.status}`)}</Badge>
            {isRunning && can("campaigns.send") && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={isCancelling}
                className={cn(HEADER_PILL, PILL_TONE.danger)}
              >
                {isCancelling ? <LoadingCircleSmall /> : t("report.stop")}
              </button>
            )}
          </div>
        }
      />

      {campaign.lastError && (
        <div className="px-8 py-6 mb-8 rounded-[1rem] bg-failure/5">
          <p className="text-[1.4rem] leading-8 text-failure">{campaign.lastError}</p>
        </div>
      )}

      {isRunning && (
        <Reveal className="flex flex-col gap-3 pb-8">
          <div className="flex items-center justify-between">
            <span className="text-[1.4rem] leading-8 text-neutral-700">
              {t("report.progress", { done, total })}
            </span>
            <span className="text-[1.4rem] leading-8 text-neutral-600">{percent}%</span>
          </div>
          <div className="w-full h-[0.8rem] rounded-[3rem] bg-neutral-100 overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-[3rem] transition-[width] duration-700"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-[1.3rem] leading-6 text-neutral-600">{t("report.progressHint")}</p>
        </Reveal>
      )}

      <Reveal className="grid grid-cols-2 lg:grid-cols-4 border-b border-neutral-100">
        {tiles.map((tile, i) => (
          <div
            key={tile.key}
            className={cn(
              "py-6 pr-6 border-neutral-100",
              i % 2 === 1 && "pl-6 lg:pl-10 border-l",
              i === 2 && "max-lg:border-t lg:pl-10 lg:border-l",
              i === 3 && "max-lg:border-t",
            )}
          >
            <Metric label={t(`report.stats.${tile.key}`)}>
              <span className={tile.danger && tile.value > 0 ? "text-failure" : undefined}>
                {tile.value.toLocaleString(locale)}
              </span>
            </Metric>
          </div>
        ))}
      </Reveal>

      <Reveal delay={0.05} className={cn(CARD, "flex flex-col gap-4 mt-12")}>
        <span className="font-primary font-medium text-[1.6rem] leading-9 text-black">
          {t("report.audience")}
        </span>
        <div className="flex flex-wrap gap-2">
          {campaign.toAllUsers && <Badge>{t("recipients.allUsers")}</Badge>}
          {campaign.toAllOrganisations && <Badge>{t("recipients.allOrganisations")}</Badge>}
          {campaign.manualEmails?.length > 0 && (
            <Badge>{t("report.manualCount", { count: campaign.manualEmails.length })}</Badge>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
          <div className="flex flex-col gap-1">
            <span className="text-[1.3rem] leading-7 text-neutral-600">{t("report.createdAt")}</span>
            <span className="text-[1.5rem] text-deep-100">
              {formatDate(campaign.createdAt, locale, "local")}
            </span>
          </div>
          {campaign.queuedAt && (
            <div className="flex flex-col gap-1">
              <span className="text-[1.3rem] leading-7 text-neutral-600">{t("report.sentAt")}</span>
              <span className="text-[1.5rem] text-deep-100">
                {formatDate(campaign.queuedAt, locale, "local")}
              </span>
            </div>
          )}
        </div>
      </Reveal>

      {failures.length > 0 && (
        <Reveal delay={0.1} className="flex flex-col gap-6 pt-12 pb-10">
          <div className="flex flex-col gap-1">
            <h4 className="font-primary font-medium text-[1.8rem] leading-10 text-black">
              {t("report.failures")}
            </h4>
            <span className="text-[1.4rem] leading-8 text-neutral-600">{t("report.failuresHint")}</span>
          </div>
          <TableFrame minWidth="64rem">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className={TABLE_HEAD}>{t("report.columns.email")}</th>
                <th className={TABLE_HEAD}>{t("report.columns.source")}</th>
                <th className={TABLE_HEAD}>{t("report.columns.reason")}</th>
              </tr>
            </thead>
            <tbody>
              {failures.map((failure) => (
                <tr key={failure.email} className="border-b border-neutral-100">
                  <td className={TABLE_CELL}>{failure.email}</td>
                  <td className={TABLE_CELL}>{t(`report.source.${failure.source}`)}</td>
                  <td className={cn(TABLE_CELL, "text-failure")}>{failure.error}</td>
                </tr>
              ))}
            </tbody>
          </TableFrame>
        </Reveal>
      )}
    </div>
  );
}
