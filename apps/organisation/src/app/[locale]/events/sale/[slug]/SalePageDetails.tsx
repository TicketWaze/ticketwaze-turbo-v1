"use client";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { DocumentText } from "iconsax-reactjs";
import { Sale } from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import TopBar from "@/components/shared/TopBar";
import { formatFileSize } from "@/components/shared/SaleCard";
import FormatDate from "@/lib/FormatDate";
import SaleMoreComponent from "./components/SaleMoreComponent";
import SaleFileManager from "./components/SaleFileManager";

export default function SalePageDetails({ sale }: { sale: Sale }) {
  const t = useTranslations("Sales.single_sale");
  const locale = useLocale();

  const sellerPrice = sale.currencyCode === "USD" ? sale.usdPrice : sale.price;
  const buyerPays = sale.pricing?.buyerPays ?? sellerPrice;
  const current = sale.files?.find((f) => f.isCurrent) ?? sale.files?.[0];
  const versions = sale.files?.length ?? 0;

  return (
    <div className={"flex flex-col gap-12 overflow-y-scroll"}>
      <TopBar title={sale.title}>
        <div className="hidden lg:flex items-center gap-4">
          <SaleMoreComponent sale={sale} />
        </div>
      </TopBar>

      {/* headline numbers */}
      <ul
        className={
          "grid grid-cols-2 lg:grid-cols-4 divide-x divide-y divide-neutral-100 border-neutral-100 border-b"
        }
      >
        <li className={"pb-12"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("stats.buyer_pays")}
          </span>
          <p className={"font-medium text-[25px] leading-12 font-primary"}>
            {formatMoney(buyerPays, sale.currencyCode, locale)}
          </p>
        </li>
        <li className={"pl-10 pb-12"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("stats.you_receive")}
          </span>
          <p className={"font-medium text-[25px] leading-12 font-primary"}>
            {formatMoney(sellerPrice, sale.currencyCode, locale)}
          </p>
        </li>
        <li className={"pt-8 lg:pt-0 lg:pl-10 pb-12"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("stats.status")}
          </span>
          <p className={"font-medium text-[25px] leading-12 font-primary"}>
            {t(`status.${sale.status}`)}
          </p>
        </li>
        <li className={"pt-8 lg:pt-0 lg:pl-10 pb-12"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("stats.file_size")}
          </span>
          <p className={"font-medium text-[25px] leading-12 font-primary"}>
            {current ? formatFileSize(current.byteSize) : "—"}
          </p>
        </li>
      </ul>

      {/* where the product stands. Only one of these is ever true: the status
          is a single linear path, not independent switches. */}
      {sale.status === "draft" && (
        <Banner tone="neutral">{t("banners.draft")}</Banner>
      )}
      {sale.status === "scanning" && (
        <Banner tone="warning">{t("banners.scanning")}</Banner>
      )}
      {sale.status === "pending_review" && (
        <Banner tone="warning">{t("banners.pending_review")}</Banner>
      )}
      {sale.status === "rejected" && (
        <Banner tone="failure">
          {t("banners.rejected")}
          {sale.rejectionReason ? ` — ${sale.rejectionReason}` : ""}
        </Banner>
      )}
      {sale.status === "unlisted" && (
        <Banner tone="neutral">{t("banners.unlisted")}</Banner>
      )}

      {/* mobile actions */}
      <div className="flex lg:hidden items-center w-full gap-8 justify-end">
        <SaleMoreComponent sale={sale} />
      </div>

      {/* the file */}
      <div className="flex flex-col gap-4">
        <span className="font-primary text-deep-100 font-medium text-[1.8rem] inline-flex items-center gap-2">
          <DocumentText size="22" color="#0d0d0d" variant="Bulk" />
          {t("file.title")}
        </span>
        <SaleFileManager sale={sale} />
        {versions > 1 && (
          <p className="text-[1.3rem] leading-7 text-neutral-600">
            {t("file.versions", { count: versions })}
          </p>
        )}
      </div>

      {/* description */}
      <div className="flex flex-col gap-4">
        {sale.coverImageUrl && (
          <Image
            src={sale.coverImageUrl}
            alt={sale.title}
            width={860}
            height={298}
            className="rounded-[10px] w-full h-[29.8rem] object-cover object-top"
          />
        )}
        <span className="font-primary text-deep-100 font-medium text-[1.8rem]">
          {t("description")}
        </span>
        <div
          className="rich-text text-[1.5rem] leading-8 text-neutral-700"
          // The description is the seller's own rich text, rendered the same way
          // the event and raffle pages render theirs.
          dangerouslySetInnerHTML={{ __html: sale.description }}
        />
      </div>

      {/* tags */}
      {sale.activityTags?.length > 0 && (
        <ul className="flex flex-wrap gap-4 text-primary-500 font-medium text-[1.4rem]">
          {sale.activityTags.map((tag) => (
            <li key={tag}>#{tag}</li>
          ))}
        </ul>
      )}

      <p className="text-[1.3rem] leading-8 text-neutral-500 pb-12">
        {t("created", { date: FormatDate(sale.createdAt, locale, "local") })}
      </p>
    </div>
  );
}

function Banner({
  tone,
  children,
}: {
  tone: "neutral" | "warning" | "failure";
  children: React.ReactNode;
}) {
  const styles = {
    neutral: {
      box: "border-neutral-200 bg-neutral-50",
      dot: "bg-neutral-400",
      text: "text-neutral-600",
    },
    warning: {
      box: "border-amber-200 bg-amber-50",
      dot: "bg-amber-500",
      text: "text-amber-700",
    },
    failure: {
      box: "border-failure/30 bg-[#FCE5EA]",
      dot: "bg-failure",
      text: "text-neutral-700",
    },
  }[tone];

  return (
    <div className={`flex items-start gap-4 rounded-[15px] border p-6 ${styles.box}`}>
      <div
        className={`w-[0.8rem] h-[0.8rem] rounded-full mt-[0.6rem] shrink-0 ${styles.dot}`}
      />
      <p className={`text-[1.5rem] leading-8 ${styles.text}`}>{children}</p>
    </div>
  );
}
