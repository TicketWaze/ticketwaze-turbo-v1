"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  Card,
  DocumentText,
  MoneyRecive,
  ShieldSecurity,
  Sms,
  Warning2,
} from "iconsax-reactjs";
import { PublicSale } from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import { fileKind, formatFileSize } from "@/lib/saleFile";
import moncash from "../../../../[slug]/checkout/moncash.svg";
import natcash from "@/assets/images/natcash.png";
import type { SalePaymentMethod } from "../saleCheckout.types";

/**
 * The payment chip, identical to the event summary's.
 *
 * Duplicated rather than imported because the event's version is typed to
 * `PaymentType` from the ticket checkout's own types; sharing it would mean
 * coupling the two flows' type modules together to save a dozen lines of
 * markup. If a third checkout ever needs it, that is the moment to lift it.
 */
function PaymentMethodDisplay({
  type,
  label,
}: {
  type: SalePaymentMethod;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-neutral-50 rounded-[12px] px-6 py-[1.2rem]">
      {type === "wallet" && (
        <MoneyRecive size="18" color="#0d0d0d" variant="Bulk" />
      )}
      {type === "moncash" && (
        <Image src={moncash} alt="MonCash" className="h-[1.8rem] w-auto" />
      )}
      {type === "natcash" && (
        <Image src={natcash} alt="NatCash" className="h-[1.8rem] w-auto" />
      )}
      {type === "card" && <Card size="18" color="#0d0d0d" variant="Bulk" />}
      <span className="text-[1.5rem] font-medium text-deep-100">{label}</span>
    </div>
  );
}

/**
 * STEP 4 — EVERYTHING, ONCE, BEFORE THE MONEY MOVES.
 *
 * The event summary's card, section for section: the same elevated panel, the
 * same gradient header, the same dashed dividers, the same oversized total and
 * the same payment chip and security line beneath it. A buyer who has bought a
 * ticket here should recognise this screen immediately.
 *
 * Two sections differ, and both because the goods differ:
 *
 * - **No fee breakdown.** An event itemises subtotal, Ticketwaze fee and
 *   transaction fee; a digital product is sold for ONE all-in number and the
 *   surcharge is never shown to a buyer (SALE-MODULE.md §6). Inventing a
 *   breakdown here would contradict the listing and the receipt.
 * - **A delivery section instead.** A gift is the only way a buyer can pay and
 *   correctly receive nothing themselves, so who it is going to is stated in
 *   the place the ticket flow uses for its fee lines.
 */
export default function SaleSummaryStep({
  delta,
  sale,
  method,
  recipientName,
  recipientEmail,
}: {
  delta: number;
  sale: PublicSale;
  method: SalePaymentMethod;
  recipientName?: string | null;
  recipientEmail?: string | null;
}) {
  const t = useTranslations("Sale");
  const ct = useTranslations("Checkout");
  const locale = useLocale();

  const paymentLabel =
    method === "wallet"
      ? ct("payment.wallet")
      : method === "moncash"
        ? "MonCash"
        : method === "natcash"
          ? "NatCash"
          : method === "card"
            ? ct("payment.card")
            : "";

  const isGift = Boolean(recipientName || recipientEmail);

  return (
    <motion.div
      initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex flex-col gap-8 lg:h-full lg:min-h-0 lg:overflow-y-auto"
    >
      <div className="bg-white rounded-[20px] border border-neutral-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-y-auto">
        {/* Header */}
        <div className="bg-linear-to-r from-primary-500/5 to-transparent border-b border-neutral-100 px-8 py-8">
          <p className="text-[1.2rem] font-medium text-neutral-400 uppercase tracking-[0.08em]">
            {ct("summary.title")}
          </p>
          <h3 className="font-primary font-semibold text-8 text-deep-100 mt-[0.4rem] leading-snug">
            {sale.title}
          </h3>
        </div>

        {/* The goods. One file, so one line — no quantity to vary. */}
        <div className="px-8 py-[1.8rem] flex flex-col gap-[1.4rem] border-b border-dashed border-neutral-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-flex items-center justify-center w-[2.8rem] h-[2.8rem] rounded-full bg-primary-50 text-primary-500 shrink-0">
                <DocumentText size="16" color="#E45B00" variant="Bulk" />
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-[1.5rem] font-medium text-deep-100 truncate">
                  {sale.file
                    ? fileKind(sale.file.originalFilename, sale.file.mimeType)
                    : t("whatYouGet")}
                </span>
                {sale.file && (
                  <span className="text-[1.3rem] leading-6 text-neutral-500">
                    {formatFileSize(sale.file.byteSize)}
                  </span>
                )}
              </div>
            </div>
            <span className="text-[1.5rem] font-medium text-deep-100 shrink-0">
              {formatMoney(
                sale.pricing.buyerPays,
                sale.pricing.currency,
                locale,
              )}
            </span>
          </div>
        </div>

        {/* Delivery — where the event flow itemises its fees. */}
        <div className="px-8 py-[1.8rem] border-b border-dashed border-neutral-200">
          <p className="text-[1.2rem] text-neutral-400 mb-[0.8rem] uppercase tracking-[0.06em]">
            {t("summary.delivery")}
          </p>
          {isGift ? (
            <div className="flex items-center gap-3 bg-neutral-50 rounded-[12px] px-6 py-[1.2rem]">
              <Sms size="18" color="#0d0d0d" variant="Bulk" />
              <span className="text-[1.5rem] font-medium text-deep-100">
                {t("gift.deliveredTo", {
                  name: recipientName ?? recipientEmail ?? "",
                })}
              </span>
            </div>
          ) : (
            <span className="text-[1.5rem] text-deep-100">
              {t("summary.deliveryToYou")}
            </span>
          )}
        </div>

        {/*
          Total. No subtotal and no fee lines above it: a digital product is one
          all-in number, and the surcharge is never itemised to a buyer.
        */}
        <div className="px-8 py-8 flex items-center justify-between border-b border-neutral-100">
          <span className="font-primary font-semibold text-[1.8rem] text-deep-100">
            {ct("summary.total")}
          </span>
          <div className="flex flex-col items-end gap-[0.2rem]">
            <span className="font-primary font-bold text-[3rem] leading-none text-primary-500">
              {formatMoney(
                sale.pricing.buyerPays,
                sale.pricing.currency,
                locale,
              )}
            </span>
            <span className="text-[1.1rem] text-neutral-400 font-normal">
              {ct("summary.tca")}
            </span>
          </div>
        </div>

        {/* Payment method */}
        {method && (
          <div className="px-8 py-6 border-b border-neutral-100">
            <p className="text-[1.2rem] text-neutral-400 mb-[0.8rem] uppercase tracking-[0.06em]">
              {ct("summary.via")}
            </p>
            <PaymentMethodDisplay type={method} label={paymentLabel} />
          </div>
        )}

        {/*
          Always shown, unlike the event's — which checks `isRefundable`,
          because a ticket may or may not be. A digital product never is.
        */}
        <div className="px-8 py-6 border-b border-neutral-100">
          <div className="flex items-start gap-3 text-[1.3rem] text-warning leading-7">
            <Warning2
              size="16"
              color="#ea961c"
              variant="TwoTone"
              className="mt-[0.2rem] shrink-0"
            />
            {t("finalSaleNote")}
          </div>
        </div>

        {/* Security */}
        <div className="px-8 py-6 flex items-center gap-[0.8rem]">
          <ShieldSecurity size="15" color="#9ca3af" />
          <span className="text-[1.2rem] text-neutral-400">
            {ct("summary.secured")}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
