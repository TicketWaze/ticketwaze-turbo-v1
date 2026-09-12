"use client";
import Image from "next/image";
import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Sale, SaleFile } from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import { ArrowLeft, DocumentDownload, Warning2 } from "iconsax-reactjs";
import { SaleStatusBadge, SaleStatusDialog } from "./SaleStatusDialog";
import { InspectSaleFileAction } from "@/actions/Sale";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import EditActivityLink from "@/components/shared/EditActivityLink";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${(bytes / 1024).toFixed(0)} KB`;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-neutral-100 py-4 last:border-0">
      <span className="text-[1.4rem] font-medium text-neutral-600">
        {label}
      </span>
      <span className="text-[1.5rem] leading-8 text-black text-right">
        {value}
      </span>
    </div>
  );
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
  const router = useRouter();
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

  return (
    <div className="flex flex-col gap-12 overflow-y-scroll">
      <button
        onClick={() => router.push("/activities")}
        className="flex items-center gap-4 w-fit cursor-pointer"
      >
        <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center">
          <ArrowLeft size="20" color="#0d0d0d" variant="Bulk" />
        </div>
        <span className="text-neutral-700 text-[1.4rem] leading-8">Back</span>
      </button>

      <div className="flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <h3 className="font-medium font-primary text-[2.6rem] leading-12 text-black">
            {sale.title}
          </h3>
          <SaleStatusBadge status={sale.status} />
        </div>
        <EditActivityLink href={`/activities/sale/${sale.saleId}/edit`} />
        <SaleStatusDialog sale={sale} hasFile={Boolean(currentFile)} />
      </div>

      {sale.status === "rejected" && sale.rejectionReason && (
        <div className="flex flex-col gap-2 rounded-[15px] border border-[#E53935]/30 bg-[#FCE5EA] p-6">
          <span className="text-[1.4rem] font-medium text-failure">
            Rejection reason
          </span>
          <p className="text-[1.4rem] leading-8 text-neutral-700">
            {sale.rejectionReason}
          </p>
        </div>
      )}

      {sale.coverImageUrl && (
        <div className="relative w-full h-100 lg:h-140 rounded-[15px] overflow-hidden">
          <Image
            src={sale.coverImageUrl}
            alt={sale.title}
            fill
            className="object-cover object-top"
          />
        </div>
      )}

      {sale.organisation && (
        <div className="flex items-center gap-4">
          {sale.organisation.profileImageUrl ? (
            <Image
              src={sale.organisation.profileImageUrl}
              width={40}
              height={40}
              alt={sale.organisation.organisationName}
              className="rounded-full"
            />
          ) : (
            <span className="w-14 h-14 flex items-center justify-center bg-black rounded-full text-white uppercase font-medium text-[2rem] font-primary">
              {sale.organisation.organisationName.slice(0, 1)}
            </span>
          )}
          <span className="text-[1.5rem] text-deep-100 leading-8">
            {sale.organisation.organisationName}
          </span>
        </div>
      )}

      <div
        className="text-[1.5rem] leading-9 text-neutral-700"
        dangerouslySetInnerHTML={{ __html: sale.description }}
      />

      {/* THE FILE. The most important panel on the page: approving publishes
          whatever is in here, and the download button is the only real check. */}
      <Card title="File">
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

      {/* A file swapped after an earlier approval is the pattern the review
          gate exists to catch, so the history is shown rather than hidden. */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Product">
          <Row
            label="Seller receives"
            value={formatMoney(sale.price, sale.currencyCode, locale)}
          />
          {sale.pricing && (
            <Row
              label="Buyer pays"
              value={formatMoney(
                sale.pricing.buyerPays,
                sale.pricing.currency,
                locale,
              )}
            />
          )}
          <Row label="Status" value={<SaleStatusBadge status={sale.status} />} />
          <Row
            label="Tags"
            value={sale.activityTags?.length ? sale.activityTags.join(", ") : "None"}
          />
        </Card>

        <Card title="History">
          <Row
            label="Submitted"
            value={new Date(sale.createdAt).toLocaleString(locale)}
          />
          <Row
            label="Last reviewed"
            value={
              sale.reviewedAt
                ? new Date(sale.reviewedAt).toLocaleString(locale)
                : "Never"
            }
          />
          <Row
            label="First published"
            value={
              sale.publishedAt
                ? new Date(sale.publishedAt).toLocaleString(locale)
                : "Never"
            }
          />
          {/* Buyers make a rejection consequential: they keep their downloads,
              so taking a product down does not undo what was already sold. */}
          <Row label="Copies sold" value={String(entitlementCount)} />
        </Card>
      </div>
    </div>
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
