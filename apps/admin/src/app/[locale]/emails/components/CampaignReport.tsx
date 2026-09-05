"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft } from "iconsax-reactjs";
import { Link } from "@/i18n/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { usePermissions } from "@/hooks/usePermissions";
import formatDate from "@/lib/FormatDate";
import { CancelCampaignAction, FetchCampaignAction } from "@/actions/Campaign";
import type { CampaignStatus } from "./EmailsPageContent";

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

const STATUS_STYLES: Record<CampaignStatus, string> = {
  draft: "bg-neutral-100 text-neutral-700",
  queued: "bg-primary-50 text-primary-600",
  sending: "bg-primary-50 text-primary-600",
  sent: "bg-success/10 text-success",
  failed: "bg-failure/10 text-failure",
  cancelled: "bg-neutral-100 text-neutral-500",
};

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

  return (
    <div className="overflow-y-scroll flex flex-col gap-8 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/emails"
          className="flex items-center gap-2 text-[1.4rem] leading-8 text-neutral-600 hover:text-primary-500 transition-colors w-fit"
        >
          <ArrowLeft size="18" />
          {t("compose.backToList")}
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <h3 className="font-medium font-primary text-[2.6rem] leading-12 text-black">
                {campaign.name}
              </h3>
              <span
                className={`inline-flex px-4 py-[0.2rem] rounded-[3rem] text-[1.3rem] leading-8 font-medium ${STATUS_STYLES[campaign.status]}`}
              >
                {t(`status.${campaign.status}`)}
              </span>
            </div>
            <p className="text-[1.4rem] leading-8 text-neutral-600">
              {campaign.subjectFr}
            </p>
          </div>

          {isRunning && can("campaigns.send") && (
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="flex items-center justify-center gap-2 px-6 py-[0.8rem] rounded-[3rem] border border-failure text-failure text-[1.4rem] leading-8 font-medium cursor-pointer disabled:opacity-50 hover:bg-failure/5 transition-colors"
            >
              {isCancelling ? <LoadingCircleSmall /> : t("report.stop")}
            </button>
          )}
        </div>
      </div>

      {campaign.lastError && (
        <div className="px-8 py-6 rounded-[10px] bg-failure/5">
          <p className="text-[1.4rem] leading-8 text-failure">
            {campaign.lastError}
          </p>
        </div>
      )}

      {/* Progress */}
      {isRunning && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[1.4rem] leading-8 text-neutral-700">
              {t("report.progress", { done, total })}
            </span>
            <span className="text-[1.4rem] leading-8 text-neutral-500">
              {percent}%
            </span>
          </div>
          <div className="w-full h-[0.8rem] rounded-[3rem] bg-neutral-100 overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-[width] duration-700"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-[1.3rem] leading-6 text-neutral-500">
            {t("report.progressHint")}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-neutral-100 border-neutral-100 border-b">
        <div className="pb-8 lg:pb-12">
          <span className="text-[14px] text-neutral-600 leading-8 pb-2 block">
            {t("report.stats.recipients")}
          </span>
          <p className="font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary">
            {total}
          </p>
        </div>
        <div className="pl-6 lg:pl-10 pb-8 lg:pb-12">
          <span className="text-[14px] text-neutral-600 leading-8 pb-2 block">
            {t("report.stats.delivered")}
          </span>
          <p className="font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary">
            {progress.sent}
          </p>
        </div>
        <div className="pt-8 lg:pt-0 lg:pl-10 pb-8 lg:pb-12">
          <span className="text-[14px] text-neutral-600 leading-8 pb-2 block">
            {t("report.stats.failed")}
          </span>
          <p
            className={`font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary ${progress.failed > 0 ? "text-failure" : ""}`}
          >
            {progress.failed}
          </p>
        </div>
        <div className="pl-6 lg:pl-10 pt-8 lg:pt-0 pb-8 lg:pb-12">
          <span className="text-[14px] text-neutral-600 leading-8 pb-2 block">
            {t("report.stats.skipped")}
          </span>
          <p className="font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary">
            {progress.skipped}
          </p>
        </div>
      </div>

      {/* Audience + timing */}
      <div className="flex flex-col gap-4 p-8 rounded-[10px] border border-neutral-200">
        <span className="text-[1.4rem] leading-8 text-neutral-700 font-medium">
          {t("report.audience")}
        </span>
        <ul className="flex flex-col gap-2 text-[1.4rem] leading-8 text-neutral-600">
          {campaign.toAllUsers && <li>· {t("recipients.allUsers")}</li>}
          {campaign.toAllOrganisations && (
            <li>· {t("recipients.allOrganisations")}</li>
          )}
          {campaign.manualEmails?.length > 0 && (
            <li>
              · {t("report.manualCount", { count: campaign.manualEmails.length })}
            </li>
          )}
        </ul>
        <div className="flex flex-col gap-1 pt-4 border-t border-neutral-100 text-[1.3rem] leading-6 text-neutral-500">
          <span>
            {t("report.createdAt")}:{" "}
            {formatDate(campaign.createdAt, locale, "local")}
          </span>
          {campaign.queuedAt && (
            <span>
              {t("report.sentAt")}:{" "}
              {formatDate(campaign.queuedAt, locale, "local")}
            </span>
          )}
        </div>
      </div>

      {/* Failures */}
      {failures.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[1.4rem] leading-8 text-neutral-700 font-medium">
              {t("report.failures")}
            </span>
            <span className="text-[1.3rem] leading-6 text-neutral-500">
              {t("report.failuresHint")}
            </span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("report.columns.email")}</TableHead>
                <TableHead>{t("report.columns.source")}</TableHead>
                <TableHead>{t("report.columns.reason")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {failures.map((failure) => (
                <TableRow key={failure.email}>
                  <TableCell>{failure.email}</TableCell>
                  <TableCell>{t(`report.source.${failure.source}`)}</TableCell>
                  <TableCell className="text-failure">
                    {failure.error}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
