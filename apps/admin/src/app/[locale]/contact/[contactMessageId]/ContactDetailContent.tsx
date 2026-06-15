"use client";
import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import BackButton from "@/components/shared/BackButton";
import formatDate from "@/lib/FormatDate";
import { type ContactMessage } from "../ContactPageContent";

export default function ContactDetailContent({
  message,
  accessToken,
}: {
  message: ContactMessage;
  accessToken: string;
}) {
  const t = useTranslations("Contact");
  const locale = useLocale();
  const router = useRouter();

  const [notesText, setNotesText] = useState(message.supportNotes ?? "");
  const [isResolved, setIsResolved] = useState(message.resolved);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  async function saveNotes() {
    setIsSavingNotes(true);
    setNotesSaved(false);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/contact/${message.contactMessageId}/notes`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ notes: notesText }),
        },
      );
      setNotesSaved(true);
    } finally {
      setIsSavingNotes(false);
    }
  }

  async function resolveMessage() {
    setIsResolving(true);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/contact/${message.contactMessageId}/resolve`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({}),
        },
      );
      setIsResolved(true);
    } finally {
      setIsResolving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      <BackButton
        text={t("back")}
        onClick={() => router.push("/contact")}
      />

      {/* Header */}
      <div className="shrink-0 flex flex-col gap-3 pb-4 border-b border-neutral-100">
        <div className="flex items-center gap-4 flex-wrap justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="font-primary font-medium text-[2.6rem] leading-12">
              {message.fullName}
            </h2>
            {isResolved ? (
              <span className="py-[0.3rem] text-[1.1rem] font-bold leading-6 uppercase text-[#349C2E] px-2 rounded-[30px] bg-[#f5f5f5]">
                {t("status.resolved")}
              </span>
            ) : (
              <span className="py-[0.3rem] text-[1.1rem] font-bold leading-6 uppercase text-[#EA961C] px-2 rounded-[30px] bg-[#f5f5f5]">
                {t("status.open")}
              </span>
            )}
          </div>
          <span className="text-[1.3rem] text-neutral-500">
            {formatDate(message.createdAt, locale, "local")}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-[1.4rem] text-neutral-600">
            <span className="text-neutral-400">{t("detail.email")}: </span>
            {message.email}
          </p>
          <p className="text-[1.4rem] text-neutral-600">
            <span className="text-neutral-400">{t("detail.subject")}: </span>
            <span className="font-medium">{message.subject}</span>
          </p>
        </div>
      </div>

      {/* Main split: message (left) + actions (right) */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">

        {/* Left: message content */}
        <div className="flex flex-col flex-1 min-h-0 gap-3">
          <span className="text-[1.2rem] font-medium text-neutral-400 uppercase tracking-wide shrink-0">
            {t("detail.message")}
          </span>
          <div className="flex-1 overflow-y-auto min-h-[120px]">
            <div className="bg-neutral-50 border border-neutral-100 rounded-[1.5rem] p-6">
              <p className="text-[1.5rem] leading-8 text-neutral-900 whitespace-pre-wrap break-words font-sans">
                {message.message}
              </p>
            </div>
          </div>
        </div>

        {/* Right: notes + resolve */}
        <div className="flex flex-col gap-6 lg:w-[320px] xl:w-[360px] shrink-0 overflow-y-auto pb-4">

          {/* Internal notes */}
          <div className="flex flex-col gap-3">
            <span className="text-[1.2rem] font-medium text-neutral-400 uppercase tracking-wide">
              {t("detail.notes")}
            </span>
            <textarea
              className="w-full rounded-[1rem] border border-neutral-200 bg-neutral-50 p-4 text-[1.4rem] text-neutral-900 leading-8 resize-none focus:outline-none focus:border-primary-500 transition-colors"
              rows={4}
              placeholder={t("detail.notes_placeholder")}
              value={notesText}
              onChange={(e) => {
                setNotesText(e.target.value);
                setNotesSaved(false);
              }}
            />
            <div className="flex justify-end">
              <button
                onClick={saveNotes}
                disabled={isSavingNotes}
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[1.3rem] font-medium px-6 py-[0.6rem] rounded-[3rem] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSavingNotes
                  ? "..."
                  : notesSaved
                    ? "✓ Saved"
                    : t("detail.save_notes")}
              </button>
            </div>
          </div>

          {/* Resolve */}
          <div className="bg-neutral-100 h-px" />
          {isResolved ? (
            <div className="flex items-center justify-center py-4 border border-[#349C2E]/20 rounded-[1rem] bg-[#349C2E]/5">
              <span className="text-[1.4rem] font-semibold text-[#349C2E]">
                {t("detail.resolved_badge")}
              </span>
            </div>
          ) : (
            <button
              onClick={resolveMessage}
              disabled={isResolving}
              className="w-full bg-[#349C2E]/10 hover:bg-[#349C2E]/20 text-[#349C2E] text-[1.4rem] font-semibold py-4 rounded-[1rem] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isResolving ? "..." : t("detail.mark_resolved")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
