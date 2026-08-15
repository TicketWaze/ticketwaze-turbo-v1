"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ButtonNeutral,
  ButtonPrimary,
  ButtonRed,
} from "@/components/shared/buttons";
import { CloseCircle, TickCircle, Warning2 } from "iconsax-reactjs";
import {
  ApproveWisePayoutAction,
  ConfirmWiseSentAction,
  MarkFailedAction,
  MarkPaidAction,
} from "@/actions/Payout";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";

type Outcome = "successful" | "failed";

/**
 * SETTLE A PAYOUT — one button, one modal, both outcomes.
 *
 * There used to be two buttons side by side. That made the two outcomes look
 * equally routine, put the destructive one permanently on screen, and hid the
 * success path entirely from any admin without `payouts.send`, who then saw a
 * payout screen offering only "mark as failed".
 *
 * Choosing the outcome inside the modal fixes all three: one entry point, the
 * choice made deliberately, and an admin who cannot send is told so instead of
 * being shown a screen with the option missing.
 *
 * What "successful" DOES depends on the method, and the copy has to be honest
 * about the difference:
 *   - bank / MonCash — the admin has already sent the money by hand, so this
 *     records it and debits the balance.
 *   - Wise, not yet approved — confirms the recipient and adds them in Wise.
 *     NOBODY IS PAID by this. The transfer is made by hand afterwards.
 *   - Wise, already approved — records the transfer the admin has now made,
 *     which is what debits the balance and tells the organiser.
 *
 * Ticketwaze does not send Wise transfers itself, and no wording here may
 * suggest otherwise — an admin who believes the money went out is an organiser
 * waiting forever.
 */
export function SettlePayoutDialog({
  trigger,
  withdrawalRequestId,
  isWise,
  wiseStage,
  canSendWise,
  resolvedName,
  recipientValue,
  amountUsd,
}: {
  trigger: React.ReactNode;
  withdrawalRequestId: string;
  isWise: boolean;
  /**
   * Which of the two Wise steps this payout is at. "approve" confirms the
   * recipient; "confirm" records the transfer that was then made by hand.
   */
  wiseStage: "approve" | "confirm";
  /** `payouts.send` — held per-admin, so this can be false for a real admin. */
  canSendWise: boolean;
  resolvedName: string;
  recipientValue: string;
  amountUsd: number;
}) {
  const t = useTranslations("Payouts.dialogs");
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const locale = useLocale();

  // Nothing about a half-filled form should survive being dismissed.
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setOutcome(null);
      setReason("");
      setNote("");
    }
  }

  const blockedFromSending = isWise && !canSendWise;

  async function handleConfirm() {
    if (!outcome) return;
    const token = session?.user.accessToken ?? "";
    setIsLoading(true);

    if (outcome === "failed") {
      const result = await MarkFailedAction(
        { reason, adminNote: note.trim() || undefined },
        token,
        locale,
        withdrawalRequestId,
      );
      if (result.status === "sucess") {
        handleOpenChange(false);
        toast.success(t("settle.failed_done"));
      } else {
        toast.error(result.error);
      }
      setIsLoading(false);
      return;
    }

    /**
     * Three different things wear the same "successful" label, and only two of
     * them pay anybody. Approving a Wise payout confirms a recipient and stops
     * there — the toast has to say what still needs doing, because nothing else
     * will chase it.
     */
    const result =
      isWise && wiseStage === "approve"
        ? await ApproveWisePayoutAction(token, locale, withdrawalRequestId)
        : isWise
          ? await ConfirmWiseSentAction(token, locale, withdrawalRequestId, note)
          : await MarkPaidAction(token, locale, withdrawalRequestId, note);

    if (result.status === "success" || result.status === "sucess") {
      handleOpenChange(false);
      toast.success(
        !isWise
          ? t("settle.paid_done")
          : wiseStage === "approve"
            ? t("approve_wise.approved_now_send")
            : t("approve_wise.sent_done"),
      );
    } else {
      toast.error(result.error);
    }
    setIsLoading(false);
  }

  const confirmDisabled =
    isLoading ||
    !outcome ||
    (outcome === "failed" && !reason.trim()) ||
    (outcome === "successful" && blockedFromSending);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      {/*
        Capped at the viewport, with only the middle scrolling.

        The body grows a lot on "successful" — recipient panel, note field,
        irreversibility warning — and the dialog is centred with a fixed
        transform, so without a cap it grows off both ends of the screen at
        once. That put the title out of reach above and, far worse, the confirm
        buttons out of reach below.

        `min-h-0` on the scroller is what actually makes it scroll: a flex child
        defaults to min-height:auto and refuses to shrink below its content.
      */}
      <DialogContent className="flex flex-col max-h-[90dvh]">
        <DialogTitle className="shrink-0">{t("settle.title")}</DialogTitle>

        <div className="flex flex-col gap-4 overflow-y-auto min-h-0 flex-1 -mx-1 px-1">
          <p className="text-[1.5rem] leading-8 text-neutral-700">
            {t("settle.description")}
          </p>

          {/* Outcome choice. Neither is preselected — this decides whether money
              moves, and a default would make it a click instead of a decision. */}
          <div className="flex flex-col gap-3 mt-2">
            <OutcomeOption
              selected={outcome === "successful"}
              onSelect={() => setOutcome("successful")}
              tone="success"
              title={
                isWise
                  ? wiseStage === "approve"
                    ? t("settle.wise_approve_title")
                    : t("settle.wise_sent_title")
                  : t("settle.paid_title")
              }
              subtitle={
                isWise
                  ? wiseStage === "approve"
                    ? t("settle.wise_approve_hint")
                    : t("settle.wise_sent_hint")
                  : t("settle.paid_hint")
              }
            />
            <OutcomeOption
              selected={outcome === "failed"}
              onSelect={() => setOutcome("failed")}
              tone="danger"
              title={t("settle.failed_title")}
              subtitle={t("settle.failed_hint")}
            />
          </div>

          {/* An admin without `payouts.send` can still reject; say that plainly
            rather than leaving a disabled control with no explanation. */}
          {outcome === "successful" && blockedFromSending && (
            <div className="w-full rounded-[12px] bg-[#FCE5EA] px-6 py-4 flex items-start gap-3">
              <Warning2
                size={18}
                color="#E53935"
                variant="Bulk"
                className="shrink-0 mt-[2px]"
              />
              <p className="text-[1.4rem] leading-7 text-failure text-left font-medium">
                {t("settle.no_send_permission")}
              </p>
            </div>
          )}

          {/* The recipient. This is the second of the two human checkpoints —
            the organiser confirmed this name at request time, and nothing in
            the code can catch a Wisetag that resolved to the wrong real person.
            Only someone reading this name can. It stays on screen at the
            confirm step too, because that is the name they should have just
            paid in Wise. */}
          {outcome === "successful" && isWise && !blockedFromSending && (
            <div className="w-full rounded-[12px] bg-neutral-100 px-6 py-5 flex flex-col gap-4 text-left">
              <Field label={t("approve_wise.recipient_label")}>
                <span className="text-[1.8rem] leading-8 font-semibold text-neutral-900 wrap-break-word">
                  {resolvedName}
                </span>
              </Field>
              <Field label={t("approve_wise.identifier_label")}>
                <span className="text-[1.5rem] leading-8 text-neutral-900 wrap-break-word">
                  {recipientValue}
                </span>
              </Field>
              <Field label={t("approve_wise.amount_label")}>
                <span className="text-[1.5rem] leading-8 text-neutral-900">
                  <span className="font-medium">
                    {amountUsd.toLocaleString()}
                  </span>{" "}
                  <span className="text-neutral-500 text-[1.3rem]">USD</span>
                </span>
              </Field>
            </div>
          )}

          {/* Required on failure: the organiser is shown this as the cause. */}
          {outcome === "failed" && (
            <div className="flex flex-col gap-2">
              <label className="text-[1.3rem] leading-6 text-neutral-500 uppercase font-medium tracking-wide px-2">
                {t("failed.reason_label")}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("failed.reason_placeholder")}
                rows={3}
                className="bg-neutral-100 rounded-[1.5rem] px-6 py-5 text-[1.5rem] leading-8 text-deep-200 outline-none border border-transparent focus:border-failure resize-none transition-colors"
              />
            </div>
          )}

          {/* Optional either way, and internal — a bank reference, who authorised
            it, why it took a week. Never shown to the organiser. */}
          {outcome && !blockedFromSending && (
            <div className="flex flex-col gap-2">
              <label className="text-[1.3rem] leading-6 text-neutral-500 uppercase font-medium tracking-wide px-2">
                {t("settle.note_label")}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("settle.note_placeholder")}
                rows={2}
                className="bg-neutral-100 rounded-[1.5rem] px-6 py-5 text-[1.5rem] leading-8 text-deep-200 outline-none border border-transparent focus:border-primary-500 resize-none transition-colors"
              />
            </div>
          )}

          {/* Says what this click does NOT do. At the approve step that is the
            whole message — nobody is paid, and the transfer still has to be
            made by hand. At the confirm step it is the opposite warning: the
            balance is debited on the admin's word that they already sent it. */}
          {outcome === "successful" && isWise && !blockedFromSending && (
            <div className="w-full rounded-[12px] bg-[#FEF3E2] px-6 py-4 flex items-start gap-3">
              <Warning2
                size={18}
                color="#EA961C"
                variant="Bulk"
                className="shrink-0 mt-[2px]"
              />
              <p className="text-[1.4rem] leading-7 text-[#EA961C] text-left font-medium">
                {wiseStage === "approve"
                  ? t("approve_wise.no_money_moves")
                  : t("approve_wise.only_if_sent")}
              </p>
            </div>
          )}
        </div>

        {/* Outside the scroller: confirming must never require scrolling to. */}
        <DialogFooter className="mt-2 shrink-0">
          <DialogClose asChild>
            <ButtonNeutral className="flex-1">{t("cancel")}</ButtonNeutral>
          </DialogClose>
          {outcome === "failed" ? (
            <ButtonRed
              className="flex-1"
              disabled={confirmDisabled}
              onClick={handleConfirm}
            >
              {isLoading ? <LoadingCircleSmall /> : t("failed.confirm")}
            </ButtonRed>
          ) : (
            <ButtonPrimary
              className="flex-1"
              disabled={confirmDisabled}
              onClick={handleConfirm}
            >
              {isLoading ? <LoadingCircleSmall /> : t("settle.confirm")}
            </ButtonPrimary>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[0.4rem]">
      <span className="text-[1.1rem] leading-6 text-neutral-500 uppercase font-medium tracking-wide">
        {label}
      </span>
      {children}
    </div>
  );
}

/**
 * The two outcomes, told apart on sight.
 *
 * Same colour pairs the admin app already uses for approved and rejected
 * everywhere else, so green and red mean here what they mean on every other
 * screen. Both carry their colour whether or not they are selected — an admin
 * about to reject a payout should be able to see which row that is before
 * reading a word of it, not only after clicking.
 */
const TONE = {
  success: { color: "#349C2E", bg: "#E8F5E2", Icon: TickCircle },
  danger: { color: "#E53935", bg: "#FCE5EA", Icon: CloseCircle },
} as const;

function OutcomeOption({
  selected,
  onSelect,
  tone,
  title,
  subtitle,
}: {
  selected: boolean;
  onSelect: () => void;
  tone: keyof typeof TONE;
  title: string;
  subtitle: string;
}) {
  const { color, bg, Icon } = TONE[tone];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-center justify-between gap-4 w-full text-left p-5 rounded-[16px] border-2 transition-colors duration-200 cursor-pointer ${
        selected ? "" : "border-neutral-100 hover:border-neutral-200"
      }`}
      // Selected borrows the tone's own tint rather than a shared highlight, so
      // the selected state reinforces which outcome it is instead of flattening
      // both into the same orange.
      style={selected ? { borderColor: color, backgroundColor: bg } : {}}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-[46px] h-[46px] rounded-[12px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: bg }}
        >
          <Icon size="22" color={color} variant="Bulk" />
        </div>
        <div className="flex flex-col gap-[3px]">
          <span
            className="font-semibold text-[1.5rem] leading-6"
            style={{ color }}
          >
            {title}
          </span>
          <span className="text-[1.2rem] leading-5 text-neutral-500">
            {subtitle}
          </span>
        </div>
      </div>
      {selected && <Icon size="22" color={color} variant="Bold" />}
    </button>
  );
}
