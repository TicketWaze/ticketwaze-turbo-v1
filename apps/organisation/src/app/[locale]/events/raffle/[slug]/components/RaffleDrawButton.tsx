"use client";
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
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Crown } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { TriggerRaffleDraw } from "@/actions/EventActions";

/**
 * Runs a manual-mode draw. Only rendered once the draw date has passed and the
 * raffle has not been drawn; the API enforces both again, so a stale page
 * cannot draw early.
 */
export default function RaffleDrawButton({
  organisationId,
  raffleId,
}: {
  organisationId: string;
  raffleId: string;
}) {
  const t = useTranslations("Raffles.single_raffle.draw");
  const locale = useLocale();
  const router = useRouter();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function runDraw() {
    setIsLoading(true);
    const result = await TriggerRaffleDraw(
      organisationId,
      raffleId,
      locale,
    );
    setIsLoading(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    closeRef.current?.click();
    toast.success(result.drawn ? t("success") : t("noEntries"));
    router.refresh();
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <ButtonPrimary className="gap-4 items-center">
          <Crown size="20" color="#fff" variant="Bulk" />
          {t("cta")}
        </ButtonPrimary>
      </DialogTrigger>
      <DialogContent className={"w-xl lg:w-208"}>
        <DialogHeader>
          <DialogTitle
            className={
              "font-medium border-b border-neutral-100 pb-8 text-[2.6rem] leading-12 text-black font-primary"
            }
          >
            {t("confirm_title")}
          </DialogTitle>
          <DialogDescription className={"sr-only"}>
            Run the raffle draw
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-8 py-4">
          <p className="text-[1.5rem] leading-8 text-neutral-600">
            {t("confirm_body")}
          </p>
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <span className="text-[1.4rem] leading-7 text-amber-700">
              {t("confirm_warning")}
            </span>
          </div>
        </div>
        <DialogFooter>
          <ButtonPrimary
            onClick={runDraw}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? <LoadingCircleSmall /> : t("confirm_cta")}
          </ButtonPrimary>
          <DialogClose ref={closeRef} className="sr-only" />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
