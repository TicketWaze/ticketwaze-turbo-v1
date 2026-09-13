"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ButtonNeutral, ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import {
  CreditAttendeeWalletAction,
  GetHtgExchangeRate,
} from "@/actions/Attendee";
import type { DialogControl } from "./dialogControl";

/** 200 tokens = 100 HTG. Mirrors `TOKENS_PER_HTG` on the API. */
const TOKENS_PER_HTG = 2;

/** Money rounded to the cent, for display only — the server does its own. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

type CreditKind = "money" | "tokens";

/**
 * CREDITING A WALLET BY HAND.
 *
 * Money and tokens are two different balances, and only one of them is money —
 * so they are two tabs, not two sections of one form. A single credit is
 * either money or tokens; the tab the admin is on IS that choice, which is why
 * leaving a tab clears what was typed there. Carrying a hidden amount across
 * the switch would let someone credit gourdes from a screen showing tokens.
 *
 * THE TWO MONEY FIELDS ARE LINKED, AND ONLY ONE OF THEM IS THE TRUTH.
 * Typing in either fills the other at the live rate, which is what makes the
 * form usable — an admin thinks in gourdes, the ledger reports in both. But
 * the request records WHICH field was typed, and the server converts from
 * that one itself. Sending both would ask it to trust a number this component
 * derived, and a rate that moved between render and submit would credit two
 * columns describing different money.
 */
export function CreditWalletDialog({
  userId,
  hideTrigger,
  open: controlledOpen,
  onOpenChange,
}: { userId: string } & DialogControl) {
  const t = useTranslations("Attendees.profile.credit");
  const locale = useLocale();
  const { data: session } = useSession();

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const [isLoading, setIsLoading] = useState(false);
  const [rate, setRate] = useState(0);

  const [kind, setKind] = useState<CreditKind>("money");
  const [htg, setHtg] = useState("");
  const [usd, setUsd] = useState("");
  /** Which money field the admin typed in. Null until they touch one. */
  const [source, setSource] = useState<"HTG" | "USD" | null>(null);
  const [tokens, setTokens] = useState("");
  const [reason, setReason] = useState("");

  /**
   * Fetched when the dialog opens rather than on mount: this sits on a page
   * an admin may never use it from, and the rate is only meaningful while the
   * form is on screen.
   */
  useEffect(() => {
    if (!open || rate > 0) return;
    let cancelled = false;
    void GetHtgExchangeRate().then((value) => {
      if (!cancelled) setRate(value);
    });
    return () => {
      cancelled = true;
    };
  }, [open, rate]);

  function clearMoney() {
    setHtg("");
    setUsd("");
    setSource(null);
  }

  function reset() {
    setKind("money");
    clearMoney();
    setTokens("");
    setReason("");
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    if (onOpenChange) onOpenChange(next);
    else setUncontrolledOpen(next);
  }

  /**
   * The reason survives the switch — it says why this person is being made
   * whole, which does not change with the unit — but the figure does not,
   * because it is the one thing the two tabs cannot share.
   */
  function handleKindChange(value: string) {
    const next = value as CreditKind;
    if (next === kind) return;
    if (next === "money") setTokens("");
    else clearMoney();
    setKind(next);
  }

  /**
   * Empties BOTH fields when one is cleared, rather than leaving the
   * conversion behind. A lone figure in the other box is a number nobody
   * typed, and submitting it would credit an amount the admin had just
   * deleted.
   */
  function handleHtg(value: string) {
    setHtg(value);
    setSource(value ? "HTG" : null);
    const amount = Number(value);
    if (!value || !Number.isFinite(amount) || !(rate > 0)) {
      setUsd("");
      return;
    }
    setUsd(String(round2(amount / rate)));
  }

  function handleUsd(value: string) {
    setUsd(value);
    setSource(value ? "USD" : null);
    const amount = Number(value);
    if (!value || !Number.isFinite(amount) || !(rate > 0)) {
      setHtg("");
      return;
    }
    setHtg(String(round2(amount * rate)));
  }

  const typedAmount = Number(source === "USD" ? usd : htg) || 0;
  const tokenCount = Math.floor(Number(tokens) || 0);
  const hasSomething = kind === "money" ? typedAmount > 0 : tokenCount > 0;
  const canSubmit = hasSomething && reason.trim().length >= 3 && !isLoading;

  async function handleConfirm() {
    if (!canSubmit) return;
    setIsLoading(true);

    const result = await CreditAttendeeWalletAction(
      userId,
      {
        ...(kind === "money"
          ? { amount: typedAmount, currency: source ?? "HTG" }
          : { tokens: tokenCount }),
        reason: reason.trim(),
      },
      session?.user.accessToken ?? "",
      locale,
    );

    if ("status" in result && result.status === "success") {
      toast.success(t("success"));
      handleOpenChange(false);
    } else {
      toast.error("error" in result ? result.error : t("error"));
    }
    setIsLoading(false);
  }

  const fieldClass =
    "w-full rounded-2xl border-2 border-neutral-200 px-4 py-3 text-[1.4rem] leading-7 text-black placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none transition-colors";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <ButtonPrimary className="py-[7.5px] w-full lg:w-auto">
            {t("trigger")}
          </ButtonPrimary>
        </DialogTrigger>
      )}
      <DialogContent>
        <div className="flex flex-col gap-6">
          <DialogTitle>{t("title")}</DialogTitle>

          <Tabs value={kind} onValueChange={handleKindChange} className="gap-6">
            <TabsList className="w-full min-w-0">
              <TabsTrigger value="money">{t("money_tab")}</TabsTrigger>
              <TabsTrigger value="tokens">{t("tokens_tab")}</TabsTrigger>
            </TabsList>

            {/* ── Money ───────────────────────────────────────────────── */}
            <TabsContent value="money" className="flex flex-col gap-6">
              <p className="text-[1.3rem] leading-6 text-neutral-500">
                {t("money_description")}
              </p>
              <div className="flex flex-col gap-3">
                <label className="text-[1.4rem] font-medium text-black">
                  {t("amount_label")}
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      inputMode="decimal"
                      value={htg}
                      onChange={(e) => handleHtg(e.target.value)}
                      placeholder="0.00"
                      aria-label="HTG"
                      className={`${fieldClass} pr-16`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[1.3rem] text-neutral-500 pointer-events-none">
                      HTG
                    </span>
                  </div>
                  <span className="text-[1.4rem] text-neutral-400 shrink-0">
                    =
                  </span>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      inputMode="decimal"
                      value={usd}
                      onChange={(e) => handleUsd(e.target.value)}
                      placeholder="0.00"
                      aria-label="USD"
                      className={`${fieldClass} pr-16`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[1.3rem] text-neutral-500 pointer-events-none">
                      USD
                    </span>
                  </div>
                </div>
                {/*
                  The rate is shown, not hidden, because the admin is about to
                  credit real money on the strength of it — and because a
                  missing rate has to be visible rather than silently leaving
                  the second field dead.
                */}
                <span className="text-[1.2rem] text-neutral-500">
                  {rate > 0
                    ? t("rate_note", { rate: round2(rate).toLocaleString() })
                    : t("rate_unavailable")}
                </span>
              </div>
            </TabsContent>

            {/* ── Tokens ──────────────────────────────────────────────── */}
            <TabsContent value="tokens" className="flex flex-col gap-6">
              <p className="text-[1.3rem] leading-6 text-neutral-500">
                {t("tokens_description")}
              </p>
              <div className="flex flex-col gap-3">
                <label className="text-[1.4rem] font-medium text-black">
                  {t("tokens_label")}
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={tokens}
                  onChange={(e) => setTokens(e.target.value)}
                  placeholder="0"
                  className={fieldClass}
                />
                <span className="text-[1.2rem] text-neutral-500">
                  {tokenCount > 0
                    ? t("tokens_worth", {
                        amount: round2(
                          tokenCount / TOKENS_PER_HTG,
                        ).toLocaleString(),
                      })
                    : t("tokens_note")}
                </span>
              </div>
            </TabsContent>
          </Tabs>

          {/* ── Reason ────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <label className="text-[1.4rem] font-medium text-black">
              {t("reason_label")} <span className="text-[#E53935]">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("reason_placeholder")}
              rows={3}
              className={`${fieldClass} resize-none`}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <ButtonNeutral className="flex-1">{t("cancel")}</ButtonNeutral>
            </DialogClose>
            <ButtonPrimary
              className="flex-1"
              disabled={!canSubmit}
              onClick={handleConfirm}
            >
              {isLoading ? (
                <LoadingCircleSmall />
              ) : kind === "money" ? (
                t("confirm_money")
              ) : (
                t("confirm_tokens")
              )}
            </ButtonPrimary>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
