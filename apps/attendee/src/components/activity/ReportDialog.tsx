"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  ArrowLeft2,
  ArrowRight2,
  CloseCircle,
  Warning2,
} from "iconsax-reactjs";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import NoAuthDialog from "@/components/Layouts/NoAuthDialog";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import successBadge from "@/assets/images/auth/success-badge.png";

const ease = [0.22, 1, 0.36, 1] as const;
const REASONS = [
  "inappropriateContent",
  "misleadingInformation",
  "fraud",
  "venue",
] as const;
const MIN_OTHER = 10;
const MAX_OTHER = 350;

/**
 * Figma "Report Event" flow, shared by activity and organisation reports:
 * pick a reason (or "Others" → free text), Submit, then "Report Submitted"
 * which closes by itself. The trigger is the red row in the ⋯ More menu.
 */
export default function ReportDialog({
  kind,
  send,
}: {
  kind: "activity" | "organisation";
  /** Sends the report; resolves to an error message, or null on success. */
  send: (message: string) => Promise<string | null>;
}) {
  const t = useTranslations("Event");
  const { data: session } = useSession();
  const pathname = usePathname();
  const label =
    kind === "activity" ? t("reportEvent") : t("reportOrganisation");

  const trigger = (
    <span className="w-full flex items-center gap-4 px-[10px] py-[8px] rounded-[7.5px] cursor-pointer hover:bg-[#FCE5EA] transition-colors">
      <Warning2 size="18" color="#DE0028" variant="Bulk" />
      <span className="text-[1.4rem] leading-8 text-failure">{label}</span>
    </span>
  );

  if (!session?.user) {
    return (
      <Dialog>
        <DialogTrigger className="w-full text-left">{trigger}</DialogTrigger>
        <NoAuthDialog callbackUrl={pathname} intent="report" />
      </Dialog>
    );
  }
  return (
    <SignedInReport kind={kind} label={label} trigger={trigger} send={send} />
  );
}

function SignedInReport({
  kind,
  label,
  trigger,
  send,
}: {
  kind: "activity" | "organisation";
  label: string;
  trigger: React.ReactNode;
  send: (message: string) => Promise<string | null>;
}) {
  const t = useTranslations("Event");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"reasons" | "other" | "done">("reasons");
  const [reason, setReason] = useState<string | null>(null);
  const [other, setOther] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  // "Returning to …": the confirmation closes itself.
  useEffect(() => {
    if (step !== "done") return;
    const timer = setTimeout(() => setOpen(false), 2200);
    return () => clearTimeout(timer);
  }, [step]);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      // Reset after the close animation so the dialog doesn't visibly jump.
      setTimeout(() => {
        setStep("reasons");
        setReason(null);
        setOther("");
        setError("");
      }, 250);
    }
  }

  async function submit() {
    const message = step === "other" ? other.trim() : reason;
    if (!message) return setError(t("validStatus"));
    if (step === "other" && message.length < MIN_OTHER)
      return setError(t("pleaseSpecifyReason"));
    setSending(true);
    const failure = await send(message);
    setSending(false);
    if (failure) toast.error(failure);
    else setStep("done");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger className="w-full text-left">{trigger}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="gap-0 max-h-[90vh] overflow-y-auto"
      >
        <AnimatePresence mode="wait" initial={false}>
          {step === "done" ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease }}
              className="flex flex-col items-center gap-10 text-center py-6"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <Image src={successBadge} alt="" width={110} height={110} />
              </motion.div>
              <div className="flex flex-col gap-4">
                <DialogTitle className="font-primary font-medium text-[2.6rem] leading-12 text-black">
                  {t("reportFlow.successTitle")}
                </DialogTitle>
                <DialogDescription className="text-[1.6rem] leading-9 text-neutral-700 max-w-[38rem]">
                  {t("reportFlow.successText")}
                </DialogDescription>
              </div>
              <p className="text-[1.5rem] text-primary-500 animate-pulse">
                {kind === "activity"
                  ? t("reportFlow.returningActivity")
                  : t("reportFlow.returningOrganisation")}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-8"
            >
              <div className="flex items-center justify-between gap-4 pb-6 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  {step === "other" && (
                    <button
                      type="button"
                      aria-label={t("back")}
                      onClick={() => {
                        setStep("reasons");
                        setError("");
                      }}
                      className="size-[3rem] rounded-full bg-neutral-100 flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                    >
                      <ArrowLeft2 size={14} color="#2E3237" variant="Bold" />
                    </button>
                  )}
                  <DialogTitle className="font-primary font-medium text-[2.2rem] leading-10 text-black">
                    {label}
                  </DialogTitle>
                </div>
                <DialogClose
                  aria-label={t("reportFlow.close")}
                  className="cursor-pointer active:scale-90 transition-transform"
                >
                  <CloseCircle size={28} color="#737C8A" variant="Bulk" />
                </DialogClose>
              </div>
              <DialogDescription className="text-center text-[1.5rem] leading-8 text-[#CDCDCD]">
                {kind === "activity"
                  ? t("reportEventDescription")
                  : t("reportOrganisationDescription")}
              </DialogDescription>

              <AnimatePresence mode="wait" initial={false}>
                {step === "reasons" ? (
                  <motion.ul
                    key="reasons"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, ease }}
                    role="radiogroup"
                    className="flex flex-col gap-4"
                  >
                    {REASONS.map((key, i) => {
                      const value = t(key);
                      const active = reason === value;
                      return (
                        <motion.li
                          key={key}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: i * 0.04, ease }}
                        >
                          <button
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => {
                              setReason(value);
                              setError("");
                            }}
                            className={cn(
                              "w-full text-left px-6 py-5 rounded-[10px] border text-[1.5rem] leading-8 text-deep-100 cursor-pointer transition-all duration-200 active:scale-[0.99]",
                              active
                                ? "bg-white border-primary-400 shadow-[0px_5px_10px_0px_rgba(0,0,0,0.08)]"
                                : "bg-neutral-100 border-transparent hover:border-primary-200",
                            )}
                          >
                            {value}
                          </button>
                        </motion.li>
                      );
                    })}
                    <motion.li
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.25,
                        delay: REASONS.length * 0.04,
                        ease,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setStep("other");
                          setError("");
                        }}
                        className="group w-full flex items-center justify-between px-6 py-5 rounded-[10px] bg-neutral-100 border border-transparent hover:border-primary-200 text-[1.5rem] leading-8 text-deep-100 cursor-pointer transition-colors"
                      >
                        {t("other")}
                        <ArrowRight2
                          size={18}
                          color="#2E3237"
                          variant="Bulk"
                          className="transition-transform group-hover:translate-x-0.5"
                        />
                      </button>
                    </motion.li>
                  </motion.ul>
                ) : (
                  <motion.div
                    key="other"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2, ease }}
                    className="flex flex-col gap-4 border border-neutral-100 rounded-[15px] p-5"
                  >
                    <label
                      htmlFor="report-other"
                      className="font-semibold text-[1.5rem] leading-8 text-deep-100"
                    >
                      {kind === "activity" ? t("question") : t("question2")}
                    </label>
                    <textarea
                      id="report-other"
                      autoFocus
                      value={other}
                      maxLength={MAX_OTHER}
                      onChange={(e) => {
                        setOther(e.target.value);
                        setError("");
                      }}
                      placeholder={t("message")}
                      className="bg-neutral-100 w-full rounded-[10px] h-[17rem] resize-none p-6 text-[1.4rem] leading-8 text-deep-200 placeholder:text-neutral-600 outline-none border border-transparent focus:border-primary-500 transition-colors"
                    />
                    <span
                      className={cn(
                        "self-end text-[1.2rem]",
                        other.trim().length < MIN_OTHER
                          ? "text-neutral-500"
                          : "text-success",
                      )}
                    >
                      {other.length} / {MAX_OTHER}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-[1.3rem] text-failure text-center overflow-hidden"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <button
                type="button"
                onClick={submit}
                disabled={sending}
                className="h-[6rem] rounded-[10rem] bg-primary-500 border-2 border-primary-500 text-white font-semibold text-[1.6rem] flex items-center justify-center cursor-pointer transition-all hover:bg-primary-500/85 active:scale-[0.98] disabled:opacity-60"
              >
                {sending ? <LoadingCircleSmall /> : t("reportFlow.submit")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
