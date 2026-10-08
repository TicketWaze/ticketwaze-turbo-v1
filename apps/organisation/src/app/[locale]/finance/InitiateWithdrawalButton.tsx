"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { InfoCircle } from "iconsax-reactjs";
import { Dialog } from "@/components/ui/dialog";
import ModalShell from "@/components/shared/ModalShell";
import { ButtonPill } from "@/components/shared/buttons";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * The header's "Initiate withdrawal" (Figma 1749:34639). Faded and inert
 * while there is nothing to withdraw (1760:45206); while a payout is already
 * open it explains why instead of opening the flow. A missing PIN is handled
 * inside the flow itself (Create Withdrawal Pin), not by a detour to Settings.
 */
export default function InitiateWithdrawalButton({
  balance,
  hasPendingPayout = false,
  className,
}: {
  balance: number;
  hasPendingPayout?: boolean;
  className?: string;
}) {
  const t = useTranslations("Finance");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const empty = balance <= 0;

  return (
    <>
      <motion.span
        whileTap={empty ? undefined : { scale: 0.97 }}
        className={cn("inline-flex", className)}
      >
        <ButtonPill
          tone="primary"
          disabled={empty}
          title={empty ? t("nothing_to_withdraw") : undefined}
          onClick={() =>
            hasPendingPayout
              ? setOpen(true)
              : router.push("/finance/initiate-withdrawal")
          }
          className="w-full px-8 py-[1rem] text-[1.4rem] font-medium"
        >
          {t("withdraw_btn")}
        </ButtonPill>
      </motion.span>
      <Dialog open={open} onOpenChange={setOpen}>
        <ModalShell title={t("withdraw_btn")}>
          <div className="w-[9rem] h-[9rem] rounded-full flex items-center justify-center bg-neutral-100">
            <InfoCircle size="36" color="#0d0d0d" variant="Bulk" aria-hidden />
          </div>
          <p className="font-sans text-[1.5rem] leading-[2.4rem] text-neutral-700 text-center">
            {t("pendingPayoutWarning")}
          </p>
        </ModalShell>
      </Dialog>
    </>
  );
}
