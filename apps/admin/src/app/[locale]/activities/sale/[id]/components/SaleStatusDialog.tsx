"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ButtonNeutral, ButtonPrimary } from "@/components/shared/buttons";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { UpdateSaleStatusAction } from "@/actions/Sale";
import { Sale } from "@ticketwaze/typescript-config";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft2 } from "iconsax-reactjs";
import { cn } from "@/lib/utils";

type SaleStatus = Sale["status"];
type Ruling = "approved" | "rejected";

/**
 * A sale's status carries its whole lifecycle, not just the review outcome, so
 * the badge covers states an admin never sets: `draft` and `scanning` belong to
 * the seller and the scan job.
 */
const STATUS_CONFIG: Record<
  SaleStatus,
  { label: string; description: string; color: string; bg: string }
> = {
  draft: {
    label: "Draft",
    description: "The seller has not uploaded a file yet",
    color: "#737373",
    bg: "#F5F5F5",
  },
  scanning: {
    label: "Scanning",
    description: "The uploaded file is being processed",
    color: "#3B82F6",
    bg: "#EBF3FE",
  },
  pending_review: {
    label: "Awaiting review",
    description: "Waiting on your decision",
    color: "#EA961C",
    bg: "#FEF3E2",
  },
  live: {
    label: "Live",
    description: "Approved and on sale",
    color: "#349C2E",
    bg: "#E8F5E2",
  },
  rejected: {
    label: "Rejected",
    description: "Turned down and not on sale",
    color: "#E53935",
    bg: "#FCE5EA",
  },
  unlisted: {
    label: "Unlisted",
    description: "Taken down by the seller; past buyers keep their downloads",
    color: "#737373",
    bg: "#F5F5F5",
  },
};

const RULING_CONFIG: Record<
  Ruling,
  { label: string; description: string; color: string }
> = {
  approved: {
    label: "Approve",
    description: "Publishes the product. Buyers can pay for it immediately.",
    color: "#349C2E",
  },
  rejected: {
    label: "Reject",
    description: "Takes it down. The seller is emailed your reason.",
    color: "#E53935",
  },
};

export function SaleStatusBadge({ status }: { status: SaleStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      style={{ color: config.color, backgroundColor: config.bg }}
      className="py-[0.3rem] px-4 text-[1.1rem] font-bold leading-6 uppercase rounded-[30px]"
    >
      {config.label}
    </span>
  );
}

/**
 * The review decision.
 *
 * Only two rulings are offered, because only two are the admin's to make — the
 * other four statuses are reached by the seller or the scan job. Neither is
 * preselected: approving puts a stranger's file in front of paying buyers, and
 * that should be a choice rather than a confirmed default.
 */
export function SaleStatusDialog({
  sale,
  hasFile,
  className,
}: {
  sale: Sale;
  /** Approving with nothing to deliver is refused by the API; say so up front. */
  hasFile: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Ruling | null>(null);
  const [step, setStep] = useState<"select" | "reason">("select");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const locale = useLocale();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setSelected(null);
      setRejectionReason("");
      setStep("select");
    }
  }

  function handleSelectChange(value: Ruling) {
    setSelected(value);
    if (value === "rejected") setStep("reason");
  }

  function handleBack() {
    setStep("select");
    setRejectionReason("");
  }

  async function handleConfirm() {
    if (!selected) return;
    setIsLoading(true);
    const result = await UpdateSaleStatusAction(
      sale.saleId,
      selected,
      session?.user.accessToken ?? "",
      locale,
      selected === "rejected" ? rejectionReason.trim() : undefined,
    );
    if (result.status === "success") {
      toast.success(
        selected === "approved"
          ? "Product approved. It is now on sale."
          : "Product rejected. The seller has been notified.",
      );
      handleOpenChange(false);
    } else {
      toast.error(result.error ?? "Failed to update status");
    }
    setIsLoading(false);
  }

  // Approving is only meaningful from `pending_review`; rejecting also applies
  // to something already live that turns out not to belong there.
  const canApprove = sale.status === "pending_review" && hasFile;
  const canReject = sale.status === "pending_review" || sale.status === "live";
  const rulings = (Object.keys(RULING_CONFIG) as Ruling[]).filter((ruling) =>
    ruling === "approved" ? canApprove : canReject,
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <ButtonNeutral
          className={cn(`py-[7.5px] flex items-center gap-3`, className)}
        >
          <span
            className="w-[0.8rem] h-[0.8rem] rounded-full shrink-0"
            style={{ backgroundColor: STATUS_CONFIG[sale.status].color }}
          />
          Review
        </ButtonNeutral>
      </DialogTrigger>
      <DialogContent className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {step === "select" ? (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col gap-2">
                <DialogTitle>Review Product</DialogTitle>
                <div className="flex items-center gap-3 text-[1.4rem] leading-8 text-neutral-600">
                  Current status:
                  <SaleStatusBadge status={sale.status} />
                </div>
              </div>

              {/* Nothing to rule on. Saying why beats an empty dialog. */}
              {rulings.length === 0 ? (
                <p className="text-[1.4rem] leading-8 text-neutral-600">
                  {sale.status === "scanning"
                    ? "This product is still being processed. It will appear in the review queue once its file is ready."
                    : sale.status === "draft"
                      ? "The seller has not uploaded a file yet, so there is nothing to review."
                      : "This product is not awaiting a decision."}
                </p>
              ) : (
                <RadioGroup
                  value={selected ?? ""}
                  onValueChange={(v) => handleSelectChange(v as Ruling)}
                  className="flex flex-col gap-3"
                >
                  {rulings.map((ruling) => {
                    const config = RULING_CONFIG[ruling];
                    const isSelected = selected === ruling;
                    return (
                      <label
                        key={ruling}
                        htmlFor={ruling}
                        className={`flex items-center gap-5 p-5 rounded-3xl border-2 cursor-pointer transition-colors ${
                          isSelected
                            ? "border-current"
                            : "border-neutral-200 hover:border-neutral-300"
                        }`}
                        style={isSelected ? { borderColor: config.color } : {}}
                      >
                        <RadioGroupItem id={ruling} value={ruling} />
                        <div className="flex flex-col gap-1 flex-1">
                          <span
                            className="text-[1.5rem] font-medium leading-8"
                            style={{ color: config.color }}
                          >
                            {config.label}
                          </span>
                          <span className="text-[1.3rem] leading-6 text-neutral-500">
                            {config.description}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </RadioGroup>
              )}

              {/* The API refuses this too; catching it here saves a round trip
                  and explains itself better than a toast would. */}
              {sale.status === "pending_review" && !hasFile && (
                <p className="text-[1.3rem] leading-6 text-failure">
                  This product has no file to deliver, so it cannot be approved.
                </p>
              )}

              <DialogFooter>
                <DialogClose asChild>
                  <ButtonNeutral className="flex-1">Cancel</ButtonNeutral>
                </DialogClose>
                <ButtonPrimary
                  className="flex-1"
                  disabled={isLoading || !selected}
                  onClick={handleConfirm}
                >
                  {isLoading ? <LoadingCircleSmall /> : "Confirm"}
                </ButtonPrimary>
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
                  onClick={handleBack}
                  className="flex items-center gap-2 text-neutral-500 text-[1.3rem] hover:text-black transition-colors w-fit cursor-pointer"
                >
                  <ArrowLeft2 size="16" color="currentColor" variant="Bulk" />
                  Back
                </button>
                <DialogTitle>Rejection Reason</DialogTitle>
                <p className="text-[1.3rem] leading-6 text-neutral-500">
                  The seller is emailed this text word for word, and it is what
                  they will try to fix. Be specific.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[1.4rem] font-medium text-black">
                  Reason <span className="text-[#E53935]">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain what is wrong with this product..."
                  rows={4}
                  autoFocus
                  className="w-full resize-none rounded-2xl border-2 border-neutral-200 px-4 py-3 text-[1.4rem] leading-7 text-black placeholder:text-neutral-400 focus:border-[#E53935] focus:outline-none transition-colors"
                />
              </div>

              <DialogFooter>
                <ButtonNeutral className="flex-1" onClick={handleBack}>
                  Back
                </ButtonNeutral>
                <ButtonPrimary
                  className="flex-1"
                  disabled={isLoading || !rejectionReason.trim()}
                  onClick={handleConfirm}
                >
                  {isLoading ? <LoadingCircleSmall /> : "Confirm Rejection"}
                </ButtonPrimary>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
