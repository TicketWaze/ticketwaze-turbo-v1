"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft2, Warning2 } from "iconsax-reactjs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ButtonNeutral, ButtonRed } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { RefundActivityAction } from "@/actions/Activity";
import { cn } from "@/lib/utils";

const MIN_REASON_LENGTH = 10;

/**
 * Refund an upcoming activity's buyers and cancel it.
 *
 * Deliberately two steps. The first states plainly what is about to happen —
 * including the parts an admin cannot undo and the guests who will not be paid
 * back — because the consequences are the decision here, not an afterthought.
 * The second takes the reason that makes the action reviewable later.
 *
 * Every guard is duplicated in the API, which is the real authority. The checks
 * here exist to explain a refusal before it happens rather than to enforce it.
 */
export default function RefundActivityDialog({
  open: openProp,
  onOpenChange,
  hideTrigger,
  activityKind,
  activityId,
  activityName,
  ticketsSold,
  disabledReason,
  className,
}: {
  activityKind: "event" | "raffle";
  activityId: string;
  activityName: string;
  ticketsSold: number;
  /** When set, the action is unavailable and this says why. */
  disabledReason?: string | null;
  className?: string;
  /** See the note on EventStatusDialog — the menu renders this as a sibling. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;

  /** Writes to whichever owns the state — the parent when it passed `open`. */
  function setOpenState(next: boolean) {
    setInternalOpen(next);
    onOpenChange?.(next);
  }
  const [step, setStep] = useState<"warn" | "reason">("warn");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const locale = useLocale();

  const noun = activityKind === "raffle" ? "raffle" : "event";

  function handleOpenChange(next: boolean) {
    setOpenState(next);
    if (!next) {
      setStep("warn");
      setReason("");
    }
  }

  async function handleConfirm() {
    setIsLoading(true);
    const result = await RefundActivityAction(
      activityKind,
      activityId,
      reason.trim(),
      session?.user.accessToken ?? "",
      locale,
    );
    setIsLoading(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    // Reported rather than a bare "done": the guest count is the part an admin
    // may need to act on by hand afterwards.
    toast.success(
      `Refunded ${result.ticketsRefunded} ticket(s) to ${result.walletsCredited} wallet(s). ${result.guestTicketsVoided} guest ticket(s) voided without refund.`,
      { duration: 12000 },
    );
    handleOpenChange(false);
  }

  if (disabledReason) {
    return (
      <ButtonNeutral
        disabled
        title={disabledReason}
        className={cn("py-[7.5px] opacity-50 cursor-not-allowed", className)}
      >
        Refund &amp; cancel
      </ButtonNeutral>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <ButtonRed className={cn("py-[7.5px]", className)}>
            Refund &amp; cancel
          </ButtonRed>
        </DialogTrigger>
      )}
      <DialogContent className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {step === "warn" ? (
            <motion.div
              key="warn"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col gap-2">
                <DialogTitle>Refund and cancel this {noun}?</DialogTitle>
                <p className="text-[1.3rem] leading-6 text-neutral-500">
                  {activityName}
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-[15px] border border-[#E53935]/30 bg-[#FDECEA] p-5">
                <div className="flex items-center gap-3">
                  <Warning2 size="20" color="#B3261E" variant="Bulk" />
                  <span className="text-[1.4rem] font-medium text-[#B3261E]">
                    This cannot be undone
                  </span>
                </div>
                <ul className="flex flex-col gap-2 text-[1.35rem] leading-7 text-neutral-700">
                  <li>
                    {ticketsSold} ticket(s) will be voided and the {noun} will be
                    cancelled.
                  </li>
                  <li>
                    Buyers with an account are refunded to their Ticketwaze
                    wallet.
                  </li>
                  <li>
                    Guest buyers have no wallet and will{" "}
                    <strong>not be refunded automatically</strong>.
                  </li>
                  <li>
                    The organiser&apos;s balance is debited by the same amount.
                  </li>
                </ul>
              </div>

              <DialogFooter>
                <ButtonNeutral
                  className="flex-1"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </ButtonNeutral>
                <ButtonRed className="flex-1" onClick={() => setStep("reason")}>
                  Continue
                </ButtonRed>
              </DialogFooter>
            </motion.div>
          ) : (
            <motion.div
              key="reason"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setStep("warn")}
                  className="flex items-center gap-2 text-neutral-500 text-[1.3rem] hover:text-black transition-colors w-fit cursor-pointer"
                >
                  <ArrowLeft2 size="16" color="currentColor" variant="Bulk" />
                  Back
                </button>
                <DialogTitle>Why is this being refunded?</DialogTitle>
                <p className="text-[1.3rem] leading-6 text-neutral-500">
                  Recorded against the {noun} so the decision can be reviewed
                  later.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[1.4rem] font-medium text-black">
                  Reason <span className="text-[#E53935]">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this activity is being refunded and cancelled..."
                  rows={4}
                  autoFocus
                  className="w-full resize-none rounded-2xl border-2 border-neutral-200 px-4 py-3 text-[1.4rem] leading-7 text-black placeholder:text-neutral-400 focus:border-[#E53935] focus:outline-none transition-colors"
                />
              </div>

              <DialogFooter>
                <ButtonNeutral
                  className="flex-1"
                  onClick={() => setStep("warn")}
                >
                  Back
                </ButtonNeutral>
                <ButtonRed
                  className="flex-1"
                  disabled={
                    isLoading || reason.trim().length < MIN_REASON_LENGTH
                  }
                  onClick={handleConfirm}
                >
                  {isLoading ? <LoadingCircleSmall /> : "Refund & cancel"}
                </ButtonRed>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
