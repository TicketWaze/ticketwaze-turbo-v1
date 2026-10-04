"use client";
import { DocumentText, ArchiveBox } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import { Sale } from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import { slugify } from "@/lib/Slugify";
import ActivityCard, { CardBadge, CardMeta, CardPrice } from "./ActivityCard";

/** Bytes as the seller thinks of them: MB, or GB once it stops being readable. */
export function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * The badge colour for a sale's position in the review lifecycle.
 *
 * Shared with the detail page so a product never wears one colour in the list
 * and another on its own page.
 */
export function saleStatusClass(status: Sale["status"]): string {
  switch (status) {
    case "live":
      return "bg-success";
    case "rejected":
      return "bg-failure";
    case "scanning":
    case "pending_review":
      return "bg-warning";
    default:
      return "bg-neutral-900";
  }
}

const ICON = { size: "15", color: "#2e3237", variant: "Bulk" } as const;

/** Every state but `live` needs the seller's eye, so it wears a badge. */
function saleBadge(sale: Sale, t: (key: string) => string): CardBadge | null {
  if (sale.status === "live") return null;
  const tone: CardBadge["tone"] =
    sale.status === "rejected"
      ? "failure"
      : sale.status === "scanning" || sale.status === "pending_review"
        ? "warning"
        : sale.status === "unlisted"
          ? "muted"
          : "neutral";
  return { label: t(`saleCard.status.${sale.status}`), tone };
}

function SaleCard({ sale }: { sale: Sale }) {
  const locale = useLocale();
  const t = useTranslations("Events");

  const sellerPrice = sale.currencyCode === "USD" ? sale.usdPrice : sale.price;
  const buyerPays = sale.pricing?.buyerPays ?? sellerPrice;
  const file = sale.files?.find((f) => f.isCurrent) ?? sale.files?.[0];

  return (
    <ActivityCard
      href={`/events/sale/${slugify(sale.title, sale.saleId)}`}
      imageUrl={sale.coverImageUrl}
      title={sale.title}
      badge={saleBadge(sale, t)}
      meta={[
        // The filename yields (they run long and unbroken), the size does not.
        <CardMeta key="f" icon={<DocumentText {...ICON} />} className="flex-1">
          {/* No file means nothing to review or sell — worth naming. */}
          {file ? file.originalFilename : t("saleCard.no_file")}
        </CardMeta>,
        file ? (
          <CardMeta
            key="s"
            icon={<ArchiveBox {...ICON} />}
            className="shrink-0"
          >
            {formatFileSize(file.byteSize)}
          </CardMeta>
        ) : undefined,
      ]}
      price={
        <CardPrice
          amount={formatMoney(buyerPays, sale.currencyCode, locale)}
          unit={t("saleCard.you_receive", {
            amount: formatMoney(sellerPrice, sale.currencyCode, locale),
          })}
        />
      }
    />
  );
}

export default SaleCard;
