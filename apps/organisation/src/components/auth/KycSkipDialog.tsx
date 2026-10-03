"use client";
import { useTranslations } from "next-intl";
import { Lock1, ShieldSecurity } from "iconsax-reactjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ButtonPrimary } from "@/components/shared/buttons";
import { pillActionClass } from "@/components/auth/AuthParts";

/**
 * "Skip verification?" — KYC is optional, but skipping it must say exactly
 * what stays locked. Same layout as the app's other confirmation dialogs.
 */
export default function KycSkipDialog({
  open,
  onOpenChange,
  onSkip,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSkip: () => void;
}) {
  const t = useTranslations("Auth.kyc.skip_dialog");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Never taller than the screen: title and buttons stay put, the
          explanation scrolls between them. */}
      <DialogContent className="w-[360px] lg:w-[520px] max-h-[calc(100dvh-4rem)] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-medium border-b border-neutral-100 pb-[2rem] text-[2.6rem] leading-[30px] text-black font-primary">
            {t("title")}
          </DialogTitle>
          <DialogDescription className="sr-only">{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto py-8 flex flex-col gap-8 items-center">
          <div className="w-[100px] h-[100px] rounded-full flex items-center justify-center bg-primary-50">
            <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center bg-primary-100">
              <ShieldSecurity size="30" color="#E45B00" variant="Bulk" />
            </div>
          </div>
          <p className="font-sans text-[1.4rem] leading-[25px] text-deep-100 text-center">
            {t("description")}
          </p>
          <ul className="w-full flex flex-col gap-4">
            {(["create", "withdraw"] as const).map((key) => (
              <li
                key={key}
                className="flex items-center gap-4 bg-neutral-100 rounded-[1.5rem] px-6 py-5 text-[1.5rem] text-deep-100"
              >
                <Lock1 size={20} variant="Bulk" color="#E45B00" />
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter className="shrink-0 flex flex-col gap-4 sm:flex-col">
          <ButtonPrimary onClick={() => onOpenChange(false)} className="w-full">
            {t("verify")}
          </ButtonPrimary>
          <button
            type="button"
            onClick={onSkip}
            className={`${pillActionClass} h-[5.5rem] w-full`}
          >
            {t("skip")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
