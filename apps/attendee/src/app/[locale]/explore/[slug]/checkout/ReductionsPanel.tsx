"use client";
import { useState } from "react";
import { CloseCircle, Coin1, TicketDiscount, TickCircle } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { formatAmount } from "@ticketwaze/currency";
import { maxSpendableTokens, tokenValue } from "@/lib/pricing";
import type { AppliedDiscount, DiscountRefusalReason } from "./checkout.types";

interface Props {
  currency: string;
  exchangeRate: number;
  /** The bill tokens are put against: after the discount and after fees. */
  billTotal: number;

  discount: AppliedDiscount | null;
  discountError: { reason: DiscountRefusalReason | "network"; message: string } | null;
  isChecking: boolean;
  onCheck: (code: string) => void;
  onClear: () => void;

  /** Zero for a guest, who has no wallet — the row then does not render. */
  availableTokens: number;
  tokens: number;
  onTokensChange: (tokens: number) => void;
}

/**
 * WHERE THE BUYER PAYS LESS.
 *
 * Two controls, deliberately kept visually distinct rather than merged into a
 * single "savings" box: they are funded by different people and behave
 * differently. The code is the organiser's promotion and changes the ticket
 * price; the tokens are Ticketwaze's and come off the total. A buyer who
 * removes one should be able to see immediately which one they removed.
 *
 * Placed on the payment step rather than the summary, so the total on the
 * final screen is already the one they will be charged — being shown a number
 * and then watching it change is the thing to avoid at the last step.
 */
export default function ReductionsPanel({
  currency,
  exchangeRate,
  billTotal,
  discount,
  discountError,
  isChecking,
  onCheck,
  onClear,
  availableTokens,
  tokens,
  onTokensChange,
}: Props) {
  const t = useTranslations("Checkout");
  const [input, setInput] = useState("");

  /**
   * The slider stops where the money stops.
   *
   * Capped at what the bill can actually absorb, not just at the balance —
   * tokens beyond that buy nothing and are not refundable, so letting the
   * buyer drag past this point would destroy value with no warning. Same
   * clamp the API applies when it debits.
   */
  const maxTokens = maxSpendableTokens(
    availableTokens,
    billTotal,
    currency,
    exchangeRate,
  );
  const applied = tokenValue(tokens, currency, exchangeRate);

  return (
    <div className="flex flex-col gap-4">
      {/* ── Discount code ─────────────────────────────────────────────── */}
      <div className="rounded-[15px] border border-neutral-100 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <TicketDiscount size="20" color="#E45B00" variant="Bulk" />
          <span className="text-[1.5rem] font-medium text-deep-100">
            {t("discount.title")}
          </span>
        </div>

        {discount ? (
          <div className="flex items-center justify-between gap-4 rounded-[12px] bg-[#EAF7EE] border border-[#BFE6CB] px-[1.5rem] py-[1.2rem]">
            <div className="flex items-center gap-3 min-w-0">
              <TickCircle
                size="18"
                color="#1F9D55"
                variant="Bulk"
                className="shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-[1.4rem] font-semibold text-[#1a7a43] uppercase truncate">
                  {discount.code}
                </span>
                <span className="text-[1.2rem] text-[#1a7a43]">
                  {discount.type === "percentage"
                    ? t("discount.applied_percentage", { value: discount.value })
                    : t("discount.applied_fixed", {
                        amount: `${formatAmount(discount.value)} ${currency}`,
                      })}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setInput("");
                onClear();
              }}
              aria-label={t("discount.remove")}
              className="shrink-0 cursor-pointer"
            >
              <CloseCircle size="20" color="#1a7a43" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value.toUpperCase())}
                // Enter submits the code rather than the checkout — pressing
                // it here should do the obvious local thing.
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  onCheck(input);
                }}
                placeholder={t("discount.placeholder")}
                aria-label={t("discount.title")}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                className="flex-1 min-w-0 bg-neutral-50 rounded-[12px] px-6 py-[1.2rem] text-[1.5rem] tracking-[0.08em] uppercase text-deep-100 outline-none border border-transparent focus:border-primary-500 placeholder:normal-case placeholder:tracking-normal placeholder:text-neutral-400"
              />
              <button
                type="button"
                disabled={!input.trim() || isChecking}
                onClick={() => onCheck(input)}
                className="shrink-0 rounded-[12px] border-2 border-primary-500 text-primary-500 bg-primary-50 px-[2rem] py-[1.1rem] text-[1.4rem] font-medium cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChecking ? t("discount.checking") : t("discount.apply")}
              </button>
            </div>
            {discountError && (
              <span role="alert" className="text-[1.3rem] text-failure">
                {discountError.message}
              </span>
            )}
          </>
        )}
      </div>

      {/* ── Ticketwaze tokens ─────────────────────────────────────────────
          Only for signed-in buyers with a balance. A guest has no wallet, and
          an empty row explaining a currency they cannot hold is noise. */}
      {availableTokens > 0 && (
        <div className="rounded-[15px] border border-neutral-100 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Coin1 size="20" color="#E45B00" variant="Bulk" />
              <span className="text-[1.5rem] font-medium text-deep-100">
                {t("tokens.title")}
              </span>
            </div>
            <span className="text-[1.3rem] text-neutral-500">
              {t("tokens.balance", { tokens: availableTokens })}
            </span>
          </div>

          {maxTokens > 0 ? (
            <>
              <input
                type="range"
                min={0}
                max={maxTokens}
                step={1}
                value={Math.min(tokens, maxTokens)}
                onChange={(event) => onTokensChange(Number(event.target.value))}
                aria-label={t("tokens.title")}
                className="w-full accent-primary-500 cursor-pointer"
              />
              <div className="flex items-center justify-between gap-4">
                <span className="text-[1.3rem] text-neutral-500">
                  {t("tokens.using", { tokens: Math.min(tokens, maxTokens) })}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-[1.4rem] font-medium text-deep-100">
                    −{formatAmount(applied)} {currency}
                  </span>
                  {/* The common case is "spend them all", so it gets a button
                      rather than a drag to the end of the track. */}
                  <button
                    type="button"
                    onClick={() => onTokensChange(tokens >= maxTokens ? 0 : maxTokens)}
                    className="text-[1.3rem] text-primary-500 font-medium cursor-pointer"
                  >
                    {tokens >= maxTokens ? t("tokens.none") : t("tokens.max")}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Holding tokens worth less than a cent of this bill, or a bill
               already cleared by the discount. Saying so beats a dead slider. */
            <span className="text-[1.3rem] text-neutral-500">
              {t("tokens.nothing_to_apply")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
