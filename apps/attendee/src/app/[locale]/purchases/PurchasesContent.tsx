"use client";
import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { DocumentDownload, Warning2 } from "iconsax-reactjs";
import { GetSaleDownloadUrl } from "@/actions/paymentActions";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { fileKind, formatFileSize } from "@/lib/saleFile";

export interface Purchase {
  entitlementId: string;
  saleId: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  purchasedAt: string;
  downloadCount: number;
  lastDownloadedAt: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  file: {
    originalFilename: string;
    byteSize: number;
    mimeType: string;
  } | null;
}

/**
 * The buyer's library.
 *
 * Downloads are unlimited and permanent, so this is a list of things owned
 * rather than a list of things claimable. A product the seller has since taken
 * down still appears here and still downloads — the entitlement outlives the
 * listing.
 */
export default function PurchasesContent({
  purchases,
  guestToken,
}: {
  purchases: Purchase[];
  /** Present when a guest opened their receipt link. */
  guestToken?: string;
}) {
  const t = useTranslations("Sale");
  const locale = useLocale();
  const { data: session } = useSession();
  const [downloading, setDownloading] = useState<string | null>(null);

  /**
   * The URL is minted per click, never at render.
   *
   * It lives about fifteen minutes; one created with the page would be dead
   * before a buyer scrolled to it, and would sit in the HTML meanwhile.
   */
  async function download(purchase: Purchase) {
    setDownloading(purchase.entitlementId);
    const result = await GetSaleDownloadUrl(
      purchase.entitlementId,
      session?.user.accessToken,
      guestToken,
    );
    if (result.status === "success" && result.url) {
      // Opened rather than navigated to: the presigned URL carries
      // Content-Disposition: attachment, so the browser downloads it and the
      // buyer keeps their place in the library.
      window.open(result.url, "_blank", "noopener,noreferrer");
    } else {
      toast.error(result.message ?? t("downloadFailed"));
    }
    setDownloading(null);
  }

  if (purchases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <span className="font-primary font-medium text-[1.8rem] leading-8 text-black">
          {t("noPurchases")}
        </span>
        <span className="text-[1.5rem] leading-8 text-neutral-600 text-center max-w-160">
          {t("noPurchasesHint")}
        </span>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-6">
      {purchases.map((purchase) => (
        <li
          key={purchase.entitlementId}
          className="flex flex-col lg:flex-row lg:items-center gap-6 justify-between rounded-[15px] border border-neutral-100 p-6"
        >
          <div className="flex items-center gap-6 min-w-0">
            {purchase.coverImageUrl && (
              <Image
                src={purchase.coverImageUrl}
                alt={purchase.title}
                width={64}
                height={64}
                className="rounded-[10px] object-cover w-[64px] h-[64px] shrink-0"
              />
            )}
            <div className="flex flex-col gap-1 min-w-0">
              <span className="font-semibold text-[1.6rem] leading-8 text-deep-100 truncate">
                {purchase.title}
              </span>
              <span className="text-[1.3rem] leading-6 text-neutral-600">
                {purchase.file &&
                  `${fileKind(purchase.file.originalFilename, purchase.file.mimeType)} · ${formatFileSize(purchase.file.byteSize)} · `}
                {new Date(purchase.purchasedAt).toLocaleDateString(locale)}
              </span>
            </div>
          </div>

          {/* A refund explains itself. An absent button with no reason reads as
              a broken page rather than a decision somebody made. */}
          {purchase.revokedAt ? (
            <div className="flex items-start gap-3 rounded-[12px] bg-[#FCE5EA] px-5 py-4 lg:max-w-100">
              <Warning2
                size={18}
                color="#E53935"
                variant="Bulk"
                className="shrink-0 mt-[2px]"
              />
              <span className="text-[1.3rem] leading-6 text-failure">
                {purchase.revokedReason ?? t("refunded")}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => download(purchase)}
              disabled={downloading === purchase.entitlementId}
              className="flex items-center justify-center gap-3 rounded-[100px] bg-primary-500 px-10 py-4 text-[1.5rem] font-medium text-white hover:bg-primary-500/80 transition-colors cursor-pointer disabled:opacity-60 shrink-0"
            >
              {downloading === purchase.entitlementId ? (
                <LoadingCircleSmall />
              ) : (
                <DocumentDownload size="18" color="#ffffff" variant="Bulk" />
              )}
              {t("download")}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
