"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight2, Card, Wallet3 } from "iconsax-reactjs";
import { NATCASH_ENABLED } from "@/lib/paymentMethods";
import moncashLogo from "../../../../[slug]/checkout/moncash.svg";
import natcashLogo from "@/assets/images/natcash.png";
import type { SalePaymentMethod } from "../saleCheckout.types";

/**
 * STEP 3 — HOW TO PAY.
 *
 * The same four options the event flow offers, in the same order and the same
 * markup, because they are the same decision. Every method is available for
 * every product: a USD-priced product is charged against its registered HTG
 * price when paid in gourdes, so MonCash and NatCash are never unavailable.
 */
export default function SalePaymentStep({
  delta,
  method,
  onSelect,
  walletShort,
}: {
  delta: number;
  method: SalePaymentMethod;
  onSelect: (method: SalePaymentMethod) => void;
  /** Wallet balance is below the price, so the option carries a warning. */
  walletShort: boolean;
}) {
  const t = useTranslations("Sale");
  const ct = useTranslations("Checkout");

  const optionClass = (type: SalePaymentMethod) =>
    `flex items-center justify-between cursor-pointer p-[15px] rounded-[15px] border transition-all ease-in-out duration-300 ${
      method === type
        ? "border-2 border-primary-500 bg-primary-50"
        : "border-neutral-100 hover:border-primary-500"
    }`;

  return (
    <motion.div
      initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex flex-col gap-8 lg:h-full lg:min-h-0 lg:overflow-y-auto"
    >
      <div className="flex flex-col gap-4">
        <button
          className={optionClass("moncash")}
          onClick={() => onSelect("moncash")}
        >
          <div className="flex items-center gap-4">
            <Image src={moncashLogo} alt="MonCash" />
            <span className="font-semibold text-[1.6rem] leading-[2.2rem] text-deep-100">
              {ct("payment.moncash")}
            </span>
          </div>
          <ArrowRight2 size="20" color="#0d0d0d" variant="Bulk" />
        </button>

        {NATCASH_ENABLED && (
          <button
            className={optionClass("natcash")}
            onClick={() => onSelect("natcash")}
          >
            <div className="flex items-center gap-4">
              <Image
                src={natcashLogo}
                alt="Logo of natcash"
                width={20}
                height={21}
              />
              <span className="font-semibold text-[1.6rem] leading-[2.2rem] text-deep-100">
                {ct("payment.natcash")}
              </span>
            </div>
            <ArrowRight2 size="20" color="#0d0d0d" variant="Bulk" />
          </button>
        )}

        <button
          className={optionClass("card")}
          onClick={() => onSelect("card")}
        >
          <div className="flex items-center gap-4">
            <Card size="20" color="#0d0d0d" variant="Bulk" />
            <span className="font-semibold text-[1.6rem] leading-[2.2rem] text-deep-100">
              {ct("payment.card")}
            </span>
          </div>
          <ArrowRight2 size="20" color="#0d0d0d" variant="Bulk" />
        </button>

        <button
          className={optionClass("wallet")}
          onClick={() => onSelect("wallet")}
        >
          <div className="flex items-center gap-4">
            <Wallet3 size="20" color="#0d0d0d" variant="Bulk" />
            <div className="flex flex-col items-start">
              <span className="font-semibold text-[1.6rem] leading-[2.2rem] text-deep-100">
                {ct("payment.wallet")}
              </span>
              {/* Said on the option itself rather than after it is chosen: a
                  buyer who cannot cover it should see that before selecting. */}
              {walletShort && (
                <span className="text-[1.3rem] leading-6 text-failure">
                  {t("walletShort")}
                </span>
              )}
            </div>
          </div>
          <ArrowRight2 size="20" color="#0d0d0d" variant="Bulk" />
        </button>
      </div>
    </motion.div>
  );
}
