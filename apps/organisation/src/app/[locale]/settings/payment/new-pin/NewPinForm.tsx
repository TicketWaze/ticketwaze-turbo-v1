"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { NewWithdrawalPin } from "@/actions/organisationActions";
import PinBoxes from "@/components/shared/PinBoxes";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { CreatedScreen } from "@/components/create/CreateParts";
import { useRouter } from "@/i18n/navigation";
import { SettingsHeader } from "../../parts";

/**
 * Set New Pin (Figma 1837:50528), reached from the reset email: create and
 * confirm the new 4-digit PIN, then back to Payment.
 */
export default function NewPinForm({
  changePinToken,
}: {
  changePinToken: string;
}) {
  const t = useTranslations("Settings.payment");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [shake, setShake] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const ready = first.length === 4 && second.length === 4;

  async function submit() {
    if (first !== second) {
      toast.error(t("pinMismatch"));
      setSecond("");
      setShake((n) => n + 1);
      return;
    }
    setBusy(true);
    const result = await NewWithdrawalPin(
      session?.activeOrganisation.organisationId ?? "",
      locale,
      changePinToken,
      { withdrawalPin: first, withdrawalPin_confirmation: second },
    );
    setBusy(false);
    if (result.status === "success") {
      setDone(true);
      setTimeout(() => router.push("/settings/payment"), 1800);
      return;
    }
    toast.error(result.error);
  }

  if (done) {
    return (
      <CreatedScreen
        title={t("pin_set_title")}
        description={t("pin_set_description")}
        pendingLabel={t("returning")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-12 pb-16 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      <SettingsHeader title={t("new_pin")} backHref="/settings/payment" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="w-full max-w-[34rem] mx-auto flex flex-col gap-8"
      >
        <div className="flex flex-col gap-6 rounded-[1.5rem] border border-neutral-100 p-6">
          <div className="flex flex-col gap-4">
            <span className="font-sans font-semibold text-[1.5rem] text-deep-100">
              {t("pin")}
            </span>
            <PinBoxes
              stretch
              value={first}
              onChange={setFirst}
              autoFocus
              label={t("pin")}
            />
          </div>
          <div className="flex flex-col gap-4">
            <span className="font-sans font-semibold text-[1.5rem] text-deep-100">
              {t("confirmPin")}
            </span>
            <PinBoxes
              stretch
              value={second}
              onChange={setSecond}
              errorKey={shake}
              label={t("confirmPin")}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!ready || busy}
          className="w-full h-[5.2rem] rounded-[10rem] bg-primary-500 font-sans font-semibold text-[1.5rem] text-white cursor-pointer hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {busy ? <LoadingCircleSmall /> : t("set_new_pin")}
        </button>
      </motion.div>
    </div>
  );
}
