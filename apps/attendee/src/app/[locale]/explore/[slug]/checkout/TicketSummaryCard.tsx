"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CloseCircle } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { formatAmount } from "@ticketwaze/currency";
import { Event, EventTicketType } from "@ticketwaze/typescript-config";
import ticketBG from "./ticket-bg.svg";
import type {
  AppliedDiscount,
  DiscountRefusalReason,
  FeeBreakdown,
  SelectedTicket,
} from "./checkout.types";

interface Props {
  selectedWithIndex: SelectedTicket[];
  ticketTypes: EventTicketType[];
  event: Event;
  isFree: boolean;
  feeBreakdown: FeeBreakdown;

  discount: AppliedDiscount | null;
  discountError: {
    reason: DiscountRefusalReason | "network";
    message: string;
  } | null;
  isChecking: boolean;
  onCheckDiscount: (code: string) => void;
  onClearDiscount: () => void;
}

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * The ticket-shaped "Summary" beside every checkout step (Figma "Buy ticket").
 *
 * Drawn on the Figma "Tix" outline (perforation + scalloped edge) with the
 * content placed in percentages of that shape, so it scales with the column.
 * Lines and total come from the same fee breakdown the final Summary step
 * prints, so the two can never disagree. The discount code lives here, as in
 * Figma: "Apply discount code" opens an inline field; an applied code shows
 * as a row and strikes the old total through.
 */
export default function TicketSummaryCard({
  selectedWithIndex,
  ticketTypes,
  event,
  isFree,
  feeBreakdown,
  discount,
  discountError,
  isChecking,
  onCheckDiscount,
  onClearDiscount,
}: Props) {
  const t = useTranslations("Checkout");
  const [editing, setEditing] = useState(false);
  const [code, setCode] = useState("");

  const {
    serviceFee,
    platformFee,
    transactionFee,
    total,
    feeWaived,
    absorbedByOrganiser,
    feesCancelled,
    totalSaved,
  } = feeBreakdown;
  const fees = serviceFee + platformFee + transactionFee;
  const showFees =
    !isFree && !absorbedByOrganiser && !feesCancelled && fees > 0;
  const hasTickets = selectedWithIndex.length > 0;
  const typeOf = (id: string) =>
    ticketTypes.find((tt) => tt.eventTicketTypeId === id);
  const priceOf = (type?: EventTicketType) =>
    type
      ? Number(event.currency === "USD" ? type.usdPrice : type.ticketTypePrice)
      : 0;
  const money = (amount: number) => `${formatAmount(amount)} ${event.currency}`;

  return (
    <div className="w-full max-w-[46rem] mx-auto drop-shadow-[0_15px_25px_rgba(0,0,0,0.06)]">
      <div
        className="relative w-full aspect-[461/681] bg-no-repeat bg-[length:100%_100%]"
        style={{ backgroundImage: `url(${ticketBG.src})` }}
      >
        <span className="absolute top-[2.9%] inset-x-0 text-center font-primary font-medium text-[2.2rem] leading-[3rem] text-black">
          {t("ticket.summary")}
        </span>

        {/* Grey receipt: line items, fees, discount. */}
        <div className="absolute top-[11.75%] h-[57.1%] inset-x-[4.35%] bg-neutral-100 rounded-[5px] p-[15px] flex flex-col gap-6 font-mono text-[1.3rem] leading-[2.2rem]">
          <span className="text-center text-deep-100">
            {t("ticket.select")}
          </span>
          <ul className="flex flex-col gap-3 overflow-y-auto min-h-0 flex-1 pr-1">
            <AnimatePresence initial={false}>
              {selectedWithIndex.map((ticket) => {
                const type = typeOf(ticket.ticketTypeId);
                return (
                  <motion.li
                    key={ticket.ticketTypeId}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.2, ease }}
                    className="flex justify-between gap-4"
                  >
                    <span className="text-neutral-600 truncate">
                      x{ticket.quantity} {type?.ticketTypeName ?? "—"}
                    </span>
                    <span className="text-deep-100 font-medium shrink-0">
                      {isFree
                        ? t("free")
                        : money(priceOf(type) * ticket.quantity)}
                    </span>
                  </motion.li>
                );
              })}
              {hasTickets && showFees && (
                <motion.li
                  key="fees"
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-between gap-4"
                >
                  <span className="text-neutral-600">{t("ticket.fees")}</span>
                  <span
                    className={
                      feeWaived
                        ? "text-neutral-400 line-through shrink-0"
                        : "text-deep-100 font-medium shrink-0"
                    }
                  >
                    {money(fees)}
                  </span>
                </motion.li>
              )}
            </AnimatePresence>
          </ul>

          {/* Discount: link → inline field → applied row (Figma states). */}
          {!isFree && hasTickets && (
            <div className="shrink-0 font-sans">
              <AnimatePresence mode="wait" initial={false}>
                {discount ? (
                  <motion.div
                    key="applied"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease }}
                    className="flex items-center justify-between gap-4 text-[1.3rem]"
                  >
                    <span className="text-neutral-600 truncate">
                      {t("ticket.discount_applied")}{" "}
                      <span className="uppercase tracking-[0.06em] text-deep-100">
                        ({discount.code})
                      </span>
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="text-deep-100 font-medium">
                        −{formatAmount(feeBreakdown.discount)}{" "}
                        <span className="text-neutral-600 font-normal">
                          {event.currency}
                        </span>
                      </span>
                      <button
                        type="button"
                        aria-label={t("discount.remove")}
                        onClick={() => {
                          setCode("");
                          setEditing(false);
                          onClearDiscount();
                        }}
                        className="cursor-pointer active:scale-90 transition-transform"
                      >
                        <CloseCircle size={16} color="#8F96A1" variant="Bulk" />
                      </button>
                    </span>
                  </motion.div>
                ) : editing ? (
                  <motion.div
                    key="field"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2, ease }}
                    className="flex flex-col gap-2"
                  >
                    <div
                      className={`flex items-center gap-3 bg-white rounded-[30px] border pl-6 pr-[5px] py-[5px] ${
                        discountError ? "border-failure" : "border-primary-400"
                      }`}
                    >
                      <label className="flex flex-col flex-1 min-w-0">
                        <span className="text-[1rem] leading-4 text-neutral-500">
                          {t("ticket.discount_code")}
                        </span>
                        <input
                          autoFocus
                          value={code}
                          onChange={(e) =>
                            setCode(e.target.value.toUpperCase())
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              onCheckDiscount(code);
                            }
                            if (e.key === "Escape") setEditing(false);
                          }}
                          autoCapitalize="characters"
                          autoCorrect="off"
                          spellCheck={false}
                          className="w-full bg-transparent outline-none text-[1.4rem] tracking-[0.06em] text-deep-100"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={!code.trim() || isChecking}
                        onClick={() => onCheckDiscount(code)}
                        className="shrink-0 h-[3.6rem] px-6 rounded-[30px] border-2 border-primary-400 bg-primary-50 text-primary-500 text-[1.3rem] cursor-pointer transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isChecking
                          ? t("discount.checking")
                          : t("ticket.apply")}
                      </button>
                    </div>
                    <AnimatePresence>
                      {discountError && (
                        <motion.span
                          role="alert"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-[1.2rem] text-failure text-center overflow-hidden"
                        >
                          {discountError.message}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.button
                    key="link"
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setEditing(true)}
                    className="w-full text-center text-[1.4rem] text-primary-500 hover:underline cursor-pointer"
                  >
                    {t("ticket.discount")}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Below the perforation: ticket chips and the total. */}
        <div className="absolute top-[77.5%] inset-x-[6%] flex flex-col items-center gap-[1.4rem]">
          <AnimatePresence initial={false}>
            {hasTickets && (
              <motion.div
                key="chips"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3 justify-center flex-wrap max-h-[6rem] overflow-hidden"
              >
                {selectedWithIndex.map((ticket) => (
                  <span
                    key={ticket.ticketTypeId}
                    className="text-primary-500 text-[1.4rem] leading-8 px-[15px] py-[5px] bg-primary-50 rounded-[20px]"
                  >
                    {typeOf(ticket.ticketTypeId)?.ticketTypeName ?? "—"}
                  </span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          {hasTickets && (
            <div className="flex items-baseline gap-4 font-primary font-medium text-[2.8rem] leading-[3.3rem] text-black">
              {isFree ? (
                t("free")
              ) : (
                <>
                  <AnimatePresence>
                    {totalSaved > 0 && (
                      <motion.span
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-neutral-400 line-through decoration-2"
                      >
                        {formatAmount(total + totalSaved)}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <motion.span
                    key={total}
                    initial={{ opacity: 0.4, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    {money(total)}
                  </motion.span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
