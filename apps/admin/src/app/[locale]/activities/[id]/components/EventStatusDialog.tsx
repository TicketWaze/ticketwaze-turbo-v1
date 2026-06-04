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
import { UpdateEventStatusAction } from "@/actions/Activity";
import { Event } from "@ticketwaze/typescript-config";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft2 } from "iconsax-reactjs";
import { cn } from "@/lib/utils";

type AdminStatus = Event["adminStatus"];

const STATUS_CONFIG: Record<
  AdminStatus,
  { label: string; description: string; color: string; bg: string }
> = {
  review: {
    label: "Under Review",
    description: "Event is pending review by the admin team",
    color: "#EA961C",
    bg: "#FEF3E2",
  },
  approved: {
    label: "Approved",
    description: "Event is approved and publicly visible",
    color: "#349C2E",
    bg: "#E8F5E2",
  },
  rejected: {
    label: "Rejected",
    description: "Event has been rejected and is not visible",
    color: "#E53935",
    bg: "#FCE5EA",
  },
  requested: {
    label: "Requested",
    description: "Organizer has requested a status change",
    color: "#3B82F6",
    bg: "#EBF3FE",
  },
};

export function StatusBadge({ status }: { status: AdminStatus }) {
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

export function EventStatusDialog({
  event,
  className,
}: {
  event: Event;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<AdminStatus>(event.adminStatus);
  const [step, setStep] = useState<"select" | "reason">("select");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const locale = useLocale();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setSelected(event.adminStatus);
      setRejectionReason("");
      setStep("select");
    }
  }

  function handleSelectChange(value: AdminStatus) {
    setSelected(value);
    if (value === "rejected") {
      setStep("reason");
    }
  }

  function handleBack() {
    setStep("select");
    setRejectionReason("");
  }

  async function handleConfirm() {
    if (selected === event.adminStatus && step === "select") {
      setOpen(false);
      return;
    }
    setIsLoading(true);
    const result = await UpdateEventStatusAction(
      event.eventId,
      selected,
      session?.user.accessToken ?? "",
      locale,
      selected === "rejected" ? rejectionReason.trim() : undefined,
    );
    if (result.status === "success") {
      toast.success("Event status updated successfully");
      setOpen(false);
    } else {
      toast.error(result.error ?? "Failed to update status");
    }
    setIsLoading(false);
  }

  const currentConfig = STATUS_CONFIG[event.adminStatus];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <ButtonNeutral
          className={cn(`py-[7.5px] flex items-center gap-3`, className)}
        >
          <span
            className="w-[0.8rem] h-[0.8rem] rounded-full shrink-0"
            style={{ backgroundColor: currentConfig.color }}
          />
          Change Status
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
                <DialogTitle>Change Event Status</DialogTitle>
                <div className="flex items-center gap-3 text-[1.4rem] leading-8 text-neutral-600">
                  Current status:
                  <StatusBadge status={event.adminStatus} />
                </div>
              </div>

              <RadioGroup
                value={selected}
                onValueChange={(v) => handleSelectChange(v as AdminStatus)}
                className="flex flex-col gap-3"
              >
                {(Object.keys(STATUS_CONFIG) as AdminStatus[]).map((status) => {
                  const config = STATUS_CONFIG[status];
                  const isSelected = selected === status;
                  return (
                    <label
                      key={status}
                      htmlFor={status}
                      className={`flex items-center gap-5 p-5 rounded-3xl border-2 cursor-pointer transition-colors ${
                        isSelected
                          ? "border-current"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                      style={isSelected ? { borderColor: config.color } : {}}
                    >
                      <RadioGroupItem id={status} value={status} />
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

              <DialogFooter>
                <DialogClose asChild>
                  <ButtonNeutral className="flex-1">Cancel</ButtonNeutral>
                </DialogClose>
                <ButtonPrimary
                  className="flex-1"
                  disabled={isLoading || selected === event.adminStatus}
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
                  Explain why this event is being rejected. This will be visible
                  to the organizer.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[1.4rem] font-medium text-black">
                  Reason <span className="text-[#E53935]">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this event is being rejected..."
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
