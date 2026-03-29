"use client";
import { ButtonRed } from "@/components/shared/buttons";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLocale, useTranslations } from "next-intl";
import { Warning2, TickCircle } from "iconsax-reactjs";
import { Ticket } from "@ticketwaze/typescript-config";
import { ReturnPaidTicketAction } from "@/actions/eventActions";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRef, useState } from "react";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";

export default function ReturnPaidTicketView({
  tickets,
}: {
  tickets: Ticket[];
}) {
  const t = useTranslations("Event");
  const { data: session } = useSession();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<"select" | "confirm">("select");
  const closeRef = useRef<HTMLButtonElement>(null);

  const allSelected = tickets.length > 0 && selectedIds.size === tickets.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tickets.map((t) => t.ticketId)));
    }
  }

  function toggleTicket(ticketId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) {
        next.delete(ticketId);
      } else {
        next.add(ticketId);
      }
      return next;
    });
  }

  function handleContinue() {
    if (selectedIds.size === 0) return;
    setStep("confirm");
  }

  function handleBack() {
    setStep("select");
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      // Reset state when dialog closes
      setSelectedIds(new Set());
      setStep("select");
    }
  }

  async function returnTicket() {
    setIsLoading(true);
    const selectedTicketIds = Array.from(selectedIds);
    const result = await ReturnPaidTicketAction(
      session?.user.accessToken ?? "",
      locale,
      selectedTicketIds,
    );
    if (result.status === "success") {
      toast.success(result.status);
    } else {
      toast.error(result.message);
    }
    setIsLoading(false);
  }
  const selectedTickets = tickets.filter((tk) => selectedIds.has(tk.ticketId));

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <ButtonRed>{t("return")}</ButtonRed>
      </DialogTrigger>
      <DialogContent className={"w-xl lg:w-208"}>
        <DialogHeader>
          <DialogTitle
            className={
              "font-medium border-b border-neutral-100 pb-8 text-[2.6rem] leading-12 text-black font-primary"
            }
          >
            {t("return")}
          </DialogTitle>
          <DialogDescription className={"sr-only"}>
            <span>Return tickets</span>
          </DialogDescription>
        </DialogHeader>

        {step === "select" ? (
          <>
            {/* Ticket list */}
            <div className="py-8 flex flex-col gap-4">
              {/* Select all row */}
              <button
                type="button"
                onClick={toggleAll}
                className="flex items-center gap-4 w-full px-4 py-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors"
              >
                <SelectionBox
                  checked={allSelected}
                  indeterminate={someSelected}
                />
                <span className="text-[1.4rem] font-medium text-black font-sans">
                  {t("selectAll")}
                </span>
                <span className="ml-auto text-[1.2rem] text-deep-100 font-sans">
                  {selectedIds.size}/{tickets.length}
                </span>
              </button>

              {/* Divider */}
              <div className="border-t border-neutral-100" />

              {/* Individual tickets */}
              <div className="flex flex-col gap-3 max-h-[280px] overflow-y-auto pr-1">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.ticketId}
                    type="button"
                    onClick={() => toggleTicket(ticket.ticketId)}
                    className={`flex items-center gap-4 w-full px-4 py-3 rounded-xl border transition-colors text-left ${
                      selectedIds.has(ticket.ticketId)
                        ? "border-red-400 bg-red-50"
                        : "border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    <SelectionBox checked={selectedIds.has(ticket.ticketId)} />
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-[1.4rem] font-medium text-black font-sans truncate">
                        1X {ticket.ticketType} - {ticket.fullName}
                      </span>
                      {ticket.ticketName && (
                        <span className="text-[1.2rem] text-deep-100 font-sans">
                          #{ticket.ticketName}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter>
              <ButtonRed
                onClick={handleContinue}
                disabled={selectedIds.size === 0}
                className="w-full"
              >
                {t("continue")} ({selectedIds.size})
              </ButtonRed>
              <DialogClose ref={closeRef} className="sr-only" />
            </DialogFooter>
          </>
        ) : (
          <>
            {/* Confirm step */}
            <div className="py-8 flex flex-col gap-8 items-center">
              <div
                className={
                  "w-40 h-40 rounded-full flex items-center justify-center bg-neutral-100"
                }
              >
                <div
                  className={
                    "w-28 h-28 rounded-full flex items-center justify-center bg-neutral-200"
                  }
                >
                  <Warning2 size="30" color="#0d0d0d" variant="Bulk" />
                </div>
              </div>

              <p
                className={`font-sans text-[1.4rem] leading-10 text-deep-100 text-center w-[320px] lg:w-full`}
              >
                {t("returnDescription")}
              </p>

              {/* Summary of selected tickets */}
              <div className="w-full flex flex-col gap-2 bg-neutral-50 rounded-xl px-4 py-3">
                <span className="text-[1.2rem] font-medium text-black font-sans">
                  {t("return")} ({selectedTickets.length})
                </span>
                {selectedTickets.map((tk) => (
                  <div
                    key={tk.ticketId}
                    className="flex items-center gap-2 text-[1.2rem] text-deep-100 font-sans"
                  >
                    <TickCircle size="14" color="#ef4444" variant="Bold" />
                    <span className="truncate">
                      1X {tk.ticketType} - {tk.fullName}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleBack}
                disabled={isLoading}
                className="w-full order-2 lg:order-1 text-[1.4rem] font-sans text-deep-100 hover:text-black transition-colors py-2"
              >
                {t("back")}
              </button>
              <ButtonRed
                onClick={returnTicket}
                disabled={isLoading}
                className="w-full order-1 lg:order-2"
              >
                {isLoading ? <LoadingCircleSmall /> : t("return")}
              </ButtonRed>

              <DialogClose ref={closeRef} className="sr-only" />
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Small checkbox-like indicator */
function SelectionBox({
  checked,
  indeterminate,
}: {
  checked: boolean;
  indeterminate?: boolean;
}) {
  return (
    <span
      className={`w-6 h-6 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
        checked || indeterminate
          ? "border-red-500 bg-red-500"
          : "border-neutral-300 bg-white"
      }`}
    >
      {indeterminate && !checked ? (
        <span className="block w-3 h-0.5 bg-white rounded-full" />
      ) : checked ? (
        <svg
          width="10"
          height="8"
          viewBox="0 0 10 8"
          fill="none"
          className="text-white"
        >
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </span>
  );
}
