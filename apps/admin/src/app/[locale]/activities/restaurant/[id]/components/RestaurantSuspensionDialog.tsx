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
import { ButtonNeutral, ButtonRed } from "@/components/shared/buttons";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { UpdateRestaurantSuspensionAction } from "@/actions/Activity";
import { Restaurant } from "@ticketwaze/typescript-config";
import { cn } from "@/lib/utils";

/**
 * Suspension is a separate axis from adminStatus — the one moderation lever
 * events and raffles never needed, because they end on their own.
 *
 * Suspending kills the public page, the QR menu, reservations and payments
 * immediately, but leaves adminStatus untouched, so lifting the suspension
 * restores the venue to exactly the state it was in. The organisation cannot
 * lift it: their own visibility endpoint writes only isListed.
 */
export function RestaurantSuspensionDialog({
  restaurant,
  className,
}: {
  restaurant: Restaurant;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const locale = useLocale();

  const isSuspended = restaurant.suspendedAt !== null;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setReason("");
  }

  async function handleConfirm() {
    setIsLoading(true);
    const result = await UpdateRestaurantSuspensionAction(
      restaurant.restaurantId,
      !isSuspended,
      session?.user.accessToken ?? "",
      locale,
      isSuspended ? undefined : reason.trim(),
    );
    if (result.status === "success") {
      toast.success(isSuspended ? "Suspension lifted" : "Venue suspended");
      setOpen(false);
    } else {
      toast.error(result.error ?? "Failed to update suspension");
    }
    setIsLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <ButtonNeutral
          className={cn(`py-[7.5px] flex items-center gap-3`, className)}
        >
          <span
            className="w-[0.8rem] h-[0.8rem] rounded-full shrink-0"
            style={{ backgroundColor: isSuspended ? "#E53935" : "#349C2E" }}
          />
          {isSuspended ? "Lift Suspension" : "Suspend Venue"}
        </ButtonNeutral>
      </DialogTrigger>
      <DialogContent className="overflow-hidden">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <DialogTitle>
              {isSuspended ? "Lift Suspension" : "Suspend Venue"}
            </DialogTitle>
            <p className="text-[1.3rem] leading-6 text-neutral-500">
              {isSuspended
                ? "The venue returns to its previous status. Its public page, QR menu, reservations and payments start working again."
                : "This immediately takes the venue off the platform: public page, QR menu, reservations and payments all stop. Its review status is preserved, and the organizer cannot lift this themselves."}
            </p>
          </div>

          {isSuspended && restaurant.suspensionReason && (
            <div className="flex flex-col gap-1 rounded-2xl bg-neutral-100 px-4 py-3">
              <span className="text-[1.2rem] font-medium text-neutral-500 uppercase">
                Current reason
              </span>
              <span className="text-[1.4rem] leading-7 text-black">
                {restaurant.suspensionReason}
              </span>
            </div>
          )}

          {!isSuspended && (
            <div className="flex flex-col gap-2">
              <label className="text-[1.4rem] font-medium text-black">
                Reason <span className="text-[#E53935]">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this venue being suspended?"
                rows={4}
                autoFocus
                className="w-full resize-none rounded-2xl border-2 border-neutral-200 px-4 py-3 text-[1.4rem] leading-7 text-black placeholder:text-neutral-400 focus:border-[#E53935] focus:outline-none transition-colors"
              />
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <ButtonNeutral className="flex-1">Cancel</ButtonNeutral>
            </DialogClose>
            <ButtonRed
              className="flex-1"
              disabled={isLoading || (!isSuspended && !reason.trim())}
              onClick={handleConfirm}
            >
              {isLoading ? (
                <LoadingCircleSmall />
              ) : isSuspended ? (
                "Lift Suspension"
              ) : (
                "Suspend"
              )}
            </ButtonRed>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
