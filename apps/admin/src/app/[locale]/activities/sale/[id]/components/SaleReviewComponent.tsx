"use client";
import { useState } from "react";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Sale, SaleFile } from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import { DocumentDownload, ReceiptDiscount, Status, Warning2 } from "iconsax-reactjs";
import { SaleStatusBadge, SaleStatusDialog } from "./SaleStatusDialog";
import { InspectSaleFileAction } from "@/actions/Sale";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import ActivityActionsMenu from "@/components/shared/ActivityActionsMenu";
import ActivityHeaderActions, {
  ActivitySuspensionNotice,
} from "@/components/shared/ActivityHeaderActions";
import ActivityDetailShell, { InfoList, InfoRow } from "@/components/shared/ActivityDetailShell";
import useAdminCan from "@/lib/useAdminCan";
import FeesHandlerDialog from "@/components/shared/FeesHandlerDialog";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${(bytes / 1024).toFixed(0)} KB`;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[15px] border border-neutral-100 p-6">
      <span className="font-semibold text-[1.6rem] leading-8 text-black">
        {title}
      </span>
      {children}
    </div>
  );
}

/**
 * How a scan result should read to the person about to publish the file.
 *
 * `skipped` is its own case on purpose. No automated scanner is configured, and
 * showing that as a pass would put a guarantee on this screen that nothing
 * behind it supports — the admin opening the file IS the check, and the copy
 * has to say so.
 */
const SCAN_CONFIG: Record<
  SaleFile["scanStatus"],
  { label: string; note: string; color: string; bg: string }
> = {
  pending: {
    label: "Not scanned yet",
    note: "The scan has not run. This product should not be approved yet.",
    color: "#737373",
    bg: "#F5F5F5",
  },
  clean: {
    label: "Clean",
    note: "An automated scan found nothing.",
    color: "#349C2E",
    bg: "#E8F5E2",
  },
  infected: {
    label: "Infected",
    note: "The scanner flagged this file. Do not approve it.",
    color: "#E53935",
    bg: "#FCE5EA",
  },
  error: {
    label: "Scan failed",
    note: "The scan could not complete, so this file has not been checked. Inspect it yourself before approving.",
    color: "#EA961C",
    bg: "#FEF3E2",
  },
  skipped: {
    label: "Not scanned",
    note: "No malware scanner is configured, so nothing has checked this file. Download and inspect it yourself before approving.",
    color: "#EA961C",
    bg: "#FEF3E2",
  },
};

export default function SaleReviewComponent({
  sale,
  entitlementCount,
}: {
  sale: Sale;
  entitlementCount: number;
}) {
  const locale = useLocale();
  const { data: session } = useSession();
  const [downloading, setDownloading] = useState<string | null>(null);

  const files = sale.files ?? [];
  const currentFile = files.find((file) => file.isCurrent) ?? null;
  const olderFiles = files.filter((file) => !file.isCurrent);

  /**
   * Fetch the presigned URL at click time, never on render.
   *
   * It lives about fifteen minutes, so one minted with the page would be dead
   * by the time an admin finished reading the listing — and would sit in the
   * HTML in the meantime.
   */
  async function handleInspect(file: SaleFile) {
    setDownloading(file.saleFileId);
    const result = await InspectSaleFileAction(
      sale.saleId,
      file.saleFileId,
      session?.user.accessToken ?? "",
      locale,
    );
    if (result.status === "success" && result.url) {
      window.open(result.url, "_blank", "noopener,noreferrer");
    } else {
      toast.error(result.error ?? "Could not open the file");
    }
    setDownloading(null);
  }

  const canManage = useAdminCan("activity.manage");
  const [dialog, setDialog] = useState<null | "status" | "fees">(null);
  const control = (kind: "status" | "fees") => ({
    hideTrigger: true,
    open: dialog === kind,
    onOpenChange: (next: boolean) => setDialog(next ? kind : null),
  });
  const suspension = sale as Sale & {
    suspendedAt?: string | null;
    suspensionReason?: string | null;
  };
  const when = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleString(locale) : "Never";

  return (
    <>
      <ActivityDetailShell
        title={sale.title}
        badges={<SaleStatusBadge status={sale.status} />}
        actions={
          <ActivityHeaderActions
            kind="sale"
            activityId={sale.saleId}
            editHref={`/activities/sale/${sale.saleId}/edit`}
            editLabel="Edit product"
            suspendedAt={suspension.suspendedAt}
          >
            <ActivityActionsMenu
              label="Actions"
              actions={[
                {
                  key: "status",
                  label: "Review product",
                  onSelect: () => setDialog("status"),
                  icon: <Status size="20" variant="Bulk" color="#2E3237" />,
                },
                canManage && {
                  key: "fees",
                  label: "Fees",
                  onSelect: () => setDialog("fees"),
                  icon: <ReceiptDiscount size="20" variant="Bulk" color="#2E3237" />,
                },
              ]}
            />
          </ActivityHeaderActions>
        }
        notices={
          <>
            <ActivitySuspensionNotice
              suspendedAt={suspension.suspendedAt}
              reason={suspension.suspensionReason}
              organisationSuspended={
                (sale.organisation as { isSuspended?: boolean } | undefined)?.isSuspended === true
              }
            />
            {sale.status === "rejected" && sale.rejectionReason && (
              <div className="flex flex-col gap-2 rounded-[15px] border border-failure/30 bg-[#FCE5EA] p-6">
                <span className="text-[1.4rem] font-medium text-failure">Rejection reason</span>
                <p className="text-[1.4rem] leading-8 text-neutral-700">{sale.rejectionReason}</p>
              </div>
            )}
          </>
        }
        imageUrl={sale.coverImageUrl}
        aboutTitle="About product"
        aboutHtml={sale.description}
        organisation={
          sale.organisation
            ? {
                organisationId: sale.organisationId,
                organisationName: sale.organisation.organisationName,
                profileImageUrl: sale.organisation.profileImageUrl ?? null,
              }
            : null
        }
        details={[
          { icon: "calendar", text: `Published: ${when(sale.publishedAt)}`, wide: true },
        ]}
        tabs={[
          {
            value: "sales",
            label: "Product performance",
            content: (
              <InfoList>
                <InfoRow label="Copies sold">{entitlementCount.toLocaleString()}</InfoRow>
                <InfoRow label="Seller receives">
                  {formatMoney(sale.price, sale.currencyCode, locale)}
                </InfoRow>
                {sale.pricing && (
                  <InfoRow label="Buyer pays">
                    {formatMoney(sale.pricing.buyerPays, sale.pricing.currency, locale)}
                  </InfoRow>
                )}
                <InfoRow label="Tags">
                  {sale.activityTags?.length ? sale.activityTags.join(", ") : "None"}
                </InfoRow>
                <InfoRow label="Submitted">{when(sale.createdAt)}</InfoRow>
                <InfoRow label="Last reviewed">{when(sale.reviewedAt)}</InfoRow>
                <InfoRow label="First published">{when(sale.publishedAt)}</InfoRow>
              </InfoList>
            ),
          },
          {
            // THE FILE. Approving publishes whatever is in here, and the
            // download button is the only real check.
            value: "file",
            label: "File",
            content: (
              <div className="flex flex-col gap-8 pt-4">
                <Card title="Current file">
                  {currentFile ? (
                    <FilePanel
                      file={currentFile}
                      onInspect={handleInspect}
                      downloading={downloading === currentFile.saleFileId}
                    />
                  ) : (
                    <p className="text-[1.4rem] leading-8 text-neutral-600 py-4">
                      No file has been uploaded. This product cannot be approved.
                    </p>
                  )}
                </Card>
                {/* A file swapped after an earlier approval is the pattern the
                    review gate exists to catch, so the history is shown. */}
                {olderFiles.length > 0 && (
                  <Card title={`Previous versions (${olderFiles.length})`}>
                    <p className="text-[1.3rem] leading-6 text-neutral-500 pb-2">
                      Buyers keep the version they paid for. A new upload sends the product
                      back here for review.
                    </p>
                    {olderFiles.map((file) => (
                      <FilePanel
                        key={file.saleFileId}
                        file={file}
                        onInspect={handleInspect}
                        downloading={downloading === file.saleFileId}
                      />
                    ))}
                  </Card>
                )}
              </div>
            ),
          },
        ]}
      />

      <SaleStatusDialog sale={sale} hasFile={Boolean(currentFile)} {...control("status")} />
      <FeesHandlerDialog kind="sale" activityId={sale.saleId} {...control("fees")} />
    </>
  );
}

function FilePanel({
  file,
  onInspect,
  downloading,
}: {
  file: SaleFile;
  onInspect: (file: SaleFile) => void;
  downloading: boolean;
}) {
  const scan = SCAN_CONFIG[file.scanStatus];
  // Anything that is not a confirmed pass earns the warning treatment, because
  // the admin is the fallback in every one of those cases.
  const needsAttention = file.scanStatus !== "clean";

  return (
    <div className="flex flex-col gap-4 border-b border-neutral-100 py-5 last:border-0">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[1.5rem] leading-8 text-black wrap-break-word">
            {file.originalFilename}
          </span>
          <span className="text-[1.3rem] leading-6 text-neutral-500">
            Version {file.version} · {formatBytes(file.byteSize)} ·{" "}
            {file.mimeType}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onInspect(file)}
          disabled={downloading}
          className="flex items-center gap-3 rounded-[30px] bg-neutral-100 px-6 py-3 text-[1.4rem] text-black hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-60"
        >
          {downloading ? (
            <LoadingCircleSmall />
          ) : (
            <DocumentDownload size="18" color="#0d0d0d" variant="Bulk" />
          )}
          Download to inspect
        </button>
      </div>

      <div
        className="flex items-start gap-3 rounded-[12px] px-5 py-4"
        style={{ backgroundColor: scan.bg }}
      >
        {needsAttention && (
          <Warning2
            size={18}
            color={scan.color}
            variant="Bulk"
            className="shrink-0 mt-[2px]"
          />
        )}
        <div className="flex flex-col gap-1">
          <span
            className="text-[1.3rem] font-bold uppercase leading-6"
            style={{ color: scan.color }}
          >
            {scan.label}
          </span>
          <span className="text-[1.3rem] leading-6 text-neutral-700">
            {scan.note}
          </span>
        </div>
      </div>
    </div>
  );
}
