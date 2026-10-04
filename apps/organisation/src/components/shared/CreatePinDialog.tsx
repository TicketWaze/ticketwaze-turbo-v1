"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import ModalShell from "@/components/shared/ModalShell";
import PinBoxes from "@/components/shared/PinBoxes";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { CreateWithdrawalPin } from "@/actions/organisationActions";

/** Figma's "Create Withdrawal Pin" popup (2058:17570 / phone 2223:67695). */
export default function CreatePinDialog({
  open,
  onOpenChange,
  organisationId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organisationId: string;
  onCreated: () => void;
}) {
  const ti = useTranslations("Finance.initiate");
  const locale = useLocale();
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [shake, setShake] = useState(0);
  const [busy, setBusy] = useState(false);

  async function create() {
    if (first.length !== 4 || second !== first) {
      toast.error(ti("pin_mismatch"));
      setSecond("");
      setShake((n) => n + 1);
      return;
    }
    setBusy(true);
    const result = await CreateWithdrawalPin(
      organisationId,
      { withdrawalPin: first, withdrawalPin_confirmation: second },
      locale,
    );
    setBusy(false);
    if ("error" in result && result.error) {
      toast.error(ti("pin_failed"));
      return;
    }
    toast.success(ti("pin_created"));
    setFirst("");
    setSecond("");
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalShell title={ti("pin_title")} className="lg:w-[44rem]">
        <div className="w-full flex flex-col gap-4">
          <span className="font-sans font-medium text-[1.4rem] text-deep-100">
            {ti("enter_pin")}
          </span>
          <PinBoxes
            stretch
            value={first}
            onChange={setFirst}
            autoFocus
            label={ti("enter_pin")}
          />
        </div>
        <div className="w-full flex flex-col gap-4">
          <span className="font-sans font-medium text-[1.4rem] text-deep-100">
            {ti("confirm_pin")}
          </span>
          <PinBoxes
            stretch
            value={second}
            onChange={setSecond}
            errorKey={shake}
            label={ti("confirm_pin")}
          />
        </div>
        <ButtonPrimary
          type="button"
          onClick={create}
          disabled={busy || first.length !== 4 || second.length !== 4}
          className="w-full h-[5.2rem] font-semibold disabled:cursor-not-allowed"
        >
          {busy ? <LoadingCircleSmall /> : ti("create_pin_button")}
        </ButtonPrimary>
      </ModalShell>
    </Dialog>
  );
}
