"use client";
import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { ButtonRed, ButtonNeutral } from "@/components/shared/buttons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TextArea } from "@/components/shared/Inputs";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import {
  RequestAccountDeletion,
  CancelAccountDeletion,
  type DeletionOrg,
} from "@/actions/userActions";
import { ArrowRight2, Calendar, Trash, Warning2 } from "iconsax-reactjs";

const REASONS = [
  "no_longer_needed",
  "privacy_concerns",
  "found_better_alternative",
  "too_many_emails",
  "other",
] as const;

type View = "form" | "blocked" | "solo_warning" | "success";

export default function DeleteAccountModal() {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const { data: session } = useSession();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("form");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoingBack, setIsGoingBack] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [orgsNeedingTransfer, setOrgsNeedingTransfer] = useState<DeletionOrg[]>([]);
  const [soloOrgs, setSoloOrgs] = useState<DeletionOrg[]>([]);
  const [soloOrgsWillLoseAccess, setSoloOrgsWillLoseAccess] = useState<DeletionOrg[]>([]);
  const [countdown, setCountdown] = useState(10);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (view !== "success") return;
    setCountdown(10);
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          signOut({
            redirect: true,
            redirectTo: `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/auth/login`,
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [view]);

  const deletionDate = scheduledAt
    ? new Date(
        new Date(scheduledAt).getTime() + 30 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  async function handleSubmit() {
    if (!reason) return;
    setIsLoading(true);
    const result = await RequestAccountDeletion(
      session?.user.accessToken ?? "",
      { reason, ...(notes ? { notes } : {}) },
      locale,
    );
    setIsLoading(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    if (result.status === "ownership_transfer_required") {
      setOrgsNeedingTransfer(result.orgsNeedingTransfer);
      setSoloOrgs(result.soloOrgs);
      setView("blocked");
      return;
    }
    if (result.status === "success") {
      setScheduledAt(result.scheduledAt);
      if (result.soloOrgsWillLoseAccess.length > 0) {
        setSoloOrgsWillLoseAccess(result.soloOrgsWillLoseAccess);
        setView("solo_warning");
      } else {
        setView("success");
      }
      return;
    }
    toast.error(result.message ?? "An error occurred");
  }

  async function handleGoBack() {
    setIsGoingBack(true);
    await CancelAccountDeletion(session?.user.accessToken ?? "", locale);
    setIsGoingBack(false);
    setSoloOrgsWillLoseAccess([]);
    setScheduledAt(null);
    setView("form");
  }

  function handleClose() {
    setOpen(false);
    setTimeout(() => {
      setView("form");
      setReason("");
      setNotes("");
      setScheduledAt(null);
      setOrgsNeedingTransfer([]);
      setSoloOrgs([]);
      setSoloOrgsWillLoseAccess([]);
    }, 300);
  }

  const reasonLabels: Record<(typeof REASONS)[number], string> = {
    no_longer_needed: t("account.delete_modal.reasons.no_longer_needed"),
    privacy_concerns: t("account.delete_modal.reasons.privacy_concerns"),
    found_better_alternative: t("account.delete_modal.reasons.found_better_alternative"),
    too_many_emails: t("account.delete_modal.reasons.too_many_emails"),
    other: t("account.delete_modal.reasons.other"),
  };

  const orgSettingsUrl = `${process.env.NEXT_PUBLIC_ORGANISATION_URL}/${locale}/settings`;

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val && view !== "success") handleClose();
        else if (val) setOpen(true);
      }}
    >
      <DialogTrigger asChild>
        <ButtonRed>{t("account.delete")}</ButtonRed>
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] overflow-y-auto flex flex-col gap-0 p-0 lg:p-0 border-0">

        {/* ── STEP 1: Form ── */}
        {view === "form" && (
          <>
            <DialogHeader className="px-[20px] pt-[20px] lg:px-[30px] lg:pt-[30px]">
              <div className="flex items-center gap-5 pb-8 border-b border-neutral-100">
                <div className="w-[46px] h-[46px] rounded-full bg-[#FCE5EA] flex items-center justify-center shrink-0">
                  <Trash size="20" color="#E31B54" variant="Bulk" />
                </div>
                <DialogTitle className="pb-0">
                  {t("account.delete_modal.title")}
                </DialogTitle>
              </div>
              <DialogDescription className="sr-only">
                {t("account.delete_modal.title")}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-8 px-[20px] lg:px-[30px] py-8">
              <p className="text-[1.5rem] leading-[2.6rem] text-neutral-600 bg-neutral-100 rounded-[14px] px-6 py-5">
                {t("account.delete_modal.body")}
              </p>

              {/* Reason radio cards */}
              <div className="flex flex-col gap-3">
                <span className="text-[1.4rem] font-semibold text-deep-100 px-1">
                  {t("account.delete_modal.reason_label")}
                </span>
                <div className="flex flex-col gap-[6px]">
                  {REASONS.map((r) => {
                    const selected = reason === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setReason(r)}
                        className={`flex items-center gap-5 w-full px-6 py-[14px] rounded-[14px] border-2 text-left transition-all duration-200 cursor-pointer ${
                          selected
                            ? "border-failure bg-[#FCE5EA]"
                            : "border-transparent bg-neutral-100 hover:bg-neutral-200/60"
                        }`}
                      >
                        <span
                          className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                            selected
                              ? "border-failure bg-failure"
                              : "border-neutral-400 bg-white"
                          }`}
                        >
                          {selected && (
                            <span className="w-[7px] h-[7px] rounded-full bg-white block" />
                          )}
                        </span>
                        <span
                          className={`text-[1.5rem] leading-8 ${
                            selected ? "text-failure font-medium" : "text-deep-100"
                          }`}
                        >
                          {reasonLabels[r]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-2">
                <TextArea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                  maxLength={500}
                  className="[&_textarea]:min-h-[10rem]"
                >
                  {t("account.delete_modal.notes_placeholder")}
                </TextArea>
                <span className="text-[1.2rem] text-neutral-400 text-right px-2">
                  {notes.length}/500
                </span>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-4 px-[20px] pb-[20px] lg:px-[30px] lg:pb-[30px]">
              <ButtonNeutral onClick={handleClose} className="sm:w-auto">
                {t("account.delete_modal.cancel")}
              </ButtonNeutral>
              <ButtonRed
                disabled={!reason || isLoading}
                onClick={handleSubmit}
                className="flex-1 gap-3"
              >
                {isLoading ? (
                  <LoadingCircleSmall />
                ) : (
                  <>
                    {t("account.delete_modal.submit")}
                    <ArrowRight2 size="18" color="currentColor" variant="Bulk" />
                  </>
                )}
              </ButtonRed>
            </div>
          </>
        )}

        {/* ── STEP 2a: Blocked — ownership transfer required ── */}
        {view === "blocked" && (
          <>
            <DialogHeader className="px-[20px] pt-[20px] lg:px-[30px] lg:pt-[30px]">
              <div className="flex items-center gap-5 pb-8 border-b border-neutral-100">
                <div className="w-[46px] h-[46px] rounded-full bg-[#FFF3CD] flex items-center justify-center shrink-0">
                  <Warning2 size="20" color="#B45309" variant="Bulk" />
                </div>
                <DialogTitle className="pb-0">
                  {t("account.delete_modal.blocked_title")}
                </DialogTitle>
              </div>
              <DialogDescription className="sr-only">
                {t("account.delete_modal.blocked_title")}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-8 px-[20px] lg:px-[30px] py-8">
              <p className="text-[1.5rem] leading-[2.6rem] text-neutral-600">
                {t("account.delete_modal.blocked_body")}
              </p>

              <div className="flex flex-col gap-[6px]">
                {orgsNeedingTransfer.map((org) => (
                  <div
                    key={org.organisationId}
                    className="flex items-center justify-between gap-4 bg-neutral-100 rounded-[14px] px-6 py-4"
                  >
                    <span className="text-[1.5rem] font-medium text-deep-100 truncate">
                      {org.organisationName}
                    </span>
                    <a
                      href={orgSettingsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[1.4rem] text-primary-500 font-medium shrink-0 hover:underline"
                    >
                      {t("account.delete_modal.go_to_settings")}
                    </a>
                  </div>
                ))}
              </div>

              {soloOrgs.length > 0 && (
                <div className="flex flex-col gap-4">
                  <p className="text-[1.4rem] leading-[2.4rem] text-neutral-500">
                    {t("account.delete_modal.blocked_solo_body")}
                  </p>
                  <div className="flex flex-col gap-[6px]">
                    {soloOrgs.map((org) => (
                      <div
                        key={org.organisationId}
                        className="bg-neutral-100 rounded-[14px] px-6 py-4"
                      >
                        <span className="text-[1.5rem] text-deep-100">
                          {org.organisationName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-[20px] pb-[20px] lg:px-[30px] lg:pb-[30px]">
              <ButtonNeutral onClick={handleClose} className="w-full">
                {t("account.delete_modal.cancel")}
              </ButtonNeutral>
            </div>
          </>
        )}

        {/* ── STEP 2b: Solo-org warning — confirm deletion ── */}
        {view === "solo_warning" && (
          <>
            <DialogHeader className="px-[20px] pt-[20px] lg:px-[30px] lg:pt-[30px]">
              <div className="flex items-center gap-5 pb-8 border-b border-neutral-100">
                <div className="w-[46px] h-[46px] rounded-full bg-[#FFF3CD] flex items-center justify-center shrink-0">
                  <Warning2 size="20" color="#B45309" variant="Bulk" />
                </div>
                <DialogTitle className="pb-0">
                  {t("account.delete_modal.confirm_title")}
                </DialogTitle>
              </div>
              <DialogDescription className="sr-only">
                {t("account.delete_modal.confirm_title")}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-8 px-[20px] lg:px-[30px] py-8">
              <p className="text-[1.5rem] leading-[2.6rem] text-neutral-600">
                {t("account.delete_modal.confirm_body")}
              </p>

              <div className="flex flex-col gap-[6px]">
                {soloOrgsWillLoseAccess.map((org) => (
                  <div
                    key={org.organisationId}
                    className="bg-neutral-100 rounded-[14px] px-6 py-4"
                  >
                    <span className="text-[1.5rem] font-medium text-deep-100">
                      {org.organisationName}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-[1.5rem] font-medium text-deep-100">
                {t("account.delete_modal.confirm_question")}
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-4 px-[20px] pb-[20px] lg:px-[30px] lg:pb-[30px]">
              <ButtonNeutral
                disabled={isGoingBack}
                onClick={handleGoBack}
                className="sm:w-auto"
              >
                {isGoingBack ? <LoadingCircleSmall /> : t("account.delete_modal.go_back")}
              </ButtonNeutral>
              <ButtonRed
                onClick={() => setView("success")}
                className="flex-1"
              >
                {t("account.delete_modal.confirm_deletion")}
              </ButtonRed>
            </div>
          </>
        )}

        {/* ── STEP 3: Success ── */}
        {view === "success" && (
          <>
            <DialogHeader className="px-[20px] pt-[20px] lg:px-[30px] lg:pt-[30px]">
              <div className="flex items-center gap-5 pb-8 border-b border-neutral-100">
                <div className="w-[46px] h-[46px] rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                  <Calendar size="20" color="#737C8A" variant="Bulk" />
                </div>
                <DialogTitle className="pb-0">
                  {t("account.delete_modal.success_title")}
                </DialogTitle>
              </div>
              <DialogDescription className="sr-only">
                {t("account.delete_modal.success_title")}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-6 px-[20px] lg:px-[30px] py-8">
              {deletionDate && (
                <div className="flex items-center justify-between bg-neutral-100 rounded-[14px] px-6 py-5">
                  <span className="text-[1.4rem] text-neutral-600">
                    {t("account.delete_modal.anonymization_date")}
                  </span>
                  <span className="text-[1.5rem] font-semibold text-deep-100">
                    {deletionDate}
                  </span>
                </div>
              )}

              <p className="text-[1.5rem] leading-[2.6rem] text-neutral-600">
                {t("account.delete_modal.success_body", { date: deletionDate })}
              </p>

              <p className="text-[1.4rem] leading-[2.4rem] text-neutral-500 bg-neutral-100 rounded-[14px] px-6 py-5">
                {t("account.delete_modal.success_hint")}
              </p>
            </div>

            <div className="px-[20px] pb-[20px] lg:px-[30px] lg:pb-[30px] flex flex-col items-center gap-4">
              <div className="relative w-16 h-16">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18" cy="18" r="15.9"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="18" cy="18" r="15.9"
                    fill="none"
                    stroke="#737C8A"
                    strokeWidth="2.5"
                    strokeDasharray="100"
                    strokeDashoffset={100 - (countdown / 10) * 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[1.6rem] font-semibold text-deep-100">
                  {countdown}
                </span>
              </div>
              <p className="text-[1.4rem] text-neutral-500">
                {t("account.delete_modal.countdown")}
              </p>
            </div>
          </>
        )}

      </DialogContent>
    </Dialog>
  );
}
