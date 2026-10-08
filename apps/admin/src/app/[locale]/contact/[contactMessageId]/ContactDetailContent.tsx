"use client";
import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { PAGE_SCROLLER } from "@/components/shared/PageTitle";
import SettingsHeader from "@/components/shared/SettingsHeader";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Reveal } from "@/components/shared/motion";
import { Badge, CARD, HEADER_PILL, PILL_TONE } from "@/components/shared/DataTable";
import formatDateTime from "@/lib/formatDateTime";
import { cn } from "@/lib/utils";
import { type ContactMessage } from "../ContactPageContent";

/**
 * One contact-form message: the message on the left, internal notes on the
 * right, Reply (opens the mail app) and Mark as resolved in the header.
 */
export default function ContactDetailContent({
  message,
  accessToken,
}: {
  message: ContactMessage;
  accessToken: string;
}) {
  const t = useTranslations("Contact");
  const locale = useLocale();

  const [notesText, setNotesText] = useState(message.supportNotes ?? "");
  const [savedNotes, setSavedNotes] = useState(message.supportNotes ?? "");
  const [isResolved, setIsResolved] = useState(message.resolved);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  async function patch(path: "notes" | "resolve", body: object) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/contact/${message.contactMessageId}/${path}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      },
    ).catch(() => null);
    return Boolean(response?.ok);
  }

  async function saveNotes() {
    setIsSavingNotes(true);
    const ok = await patch("notes", { notes: notesText });
    setIsSavingNotes(false);
    if (ok) {
      setSavedNotes(notesText);
      toast.success(t("detail.notes_saved"));
    } else toast.error(t("detail.error"));
  }

  async function resolveMessage() {
    setIsResolving(true);
    const ok = await patch("resolve", {});
    setIsResolving(false);
    if (ok) {
      setIsResolved(true);
      toast.success(t("detail.resolved_toast"));
    } else toast.error(t("detail.error"));
  }

  const replyHref = `mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`;
  const label = "text-[1.3rem] leading-7 text-neutral-600";

  return (
    <div className={cn(PAGE_SCROLLER, "gap-0")}>
      <SettingsHeader
        title={message.fullName}
        back={{ href: "/contact", label: t("title") }}
        actions={
          <div className="flex items-center gap-[1rem] w-full lg:w-auto">
            <a href={replyHref} className={cn(HEADER_PILL, PILL_TONE.neutral)}>
              {t("detail.reply")}
            </a>
            {isResolved ? (
              <span className={cn(HEADER_PILL, PILL_TONE.success, "cursor-default")}>
                {t("detail.resolved_badge")}
              </span>
            ) : (
              <button
                type="button"
                onClick={resolveMessage}
                disabled={isResolving}
                className={cn(HEADER_PILL, PILL_TONE.primary)}
              >
                {isResolving ? <LoadingCircleSmall /> : t("detail.mark_resolved")}
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_32rem] xl:grid-cols-[1fr_36rem] gap-8 pb-10">
        <Reveal className={cn(CARD, "flex flex-col gap-8 min-w-0")}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-8 border-b border-neutral-100">
            <div className="flex flex-col gap-1 min-w-0">
              <span className={label}>{t("detail.email")}</span>
              <a
                href={`mailto:${message.email}`}
                className="text-[1.5rem] text-primary-500 truncate hover:underline"
              >
                {message.email}
              </a>
            </div>
            <div className="flex flex-col gap-1">
              <span className={label}>{t("detail.received")}</span>
              <span className="text-[1.5rem] text-deep-100">
                {formatDateTime(message.createdAt, locale)}
              </span>
            </div>
            <div className="flex flex-col gap-1 items-start">
              <span className={label}>{t("table.status")}</span>
              <Badge tone={isResolved ? "success" : "warning"}>
                {t(isResolved ? "status.resolved" : "status.open")}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <span className={label}>{t("detail.subject")}</span>
            <p className="font-primary font-medium text-[1.8rem] leading-10 text-black break-words">
              {message.subject}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <span className={label}>{t("detail.message")}</span>
            <p className="text-[1.5rem] leading-9 text-deep-100 whitespace-pre-wrap break-words">
              {message.message}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.05} className={cn(CARD, "flex flex-col gap-4 h-fit")}>
          <div className="flex flex-col gap-1">
            <span className="font-primary font-medium text-[1.6rem] leading-9 text-black">
              {t("detail.notes")}
            </span>
            <span className={label}>{t("detail.notes_hint")}</span>
          </div>
          <textarea
            className="w-full rounded-[1rem] bg-neutral-100 p-5 text-[1.4rem] leading-8 text-deep-100 resize-none outline-none focus:ring-2 focus:ring-primary-200 transition-shadow"
            rows={6}
            maxLength={5000}
            placeholder={t("detail.notes_placeholder")}
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
          />
          <button
            type="button"
            onClick={saveNotes}
            disabled={isSavingNotes || notesText === savedNotes}
            className={cn(HEADER_PILL, PILL_TONE.neutral, "w-full lg:w-full")}
          >
            {isSavingNotes ? <LoadingCircleSmall /> : t("detail.save_notes")}
          </button>
        </Reveal>
      </div>
    </div>
  );
}
