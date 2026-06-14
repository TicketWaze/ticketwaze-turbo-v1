"use client";
import React, { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import BackButton from "@/components/shared/BackButton";
import formatDate from "@/lib/FormatDate";
import { type SupportThread, type SupportMessage } from "../SupportPageContent";

export type SupportThreadDetail = SupportThread & {
  messages: SupportMessage[];
};

export default function SupportDetailContent({
  thread,
  chatUrl,
  accessToken,
}: {
  thread: SupportThreadDetail;
  chatUrl: string;
  accessToken: string;
}) {
  const t = useTranslations("Support");
  const locale = useLocale();
  const router = useRouter();

  const [messages, setMessages] = useState<SupportMessage[]>(
    thread.messages ?? [],
  );
  const [replyText, setReplyText] = useState("");
  const [notesText, setNotesText] = useState(thread.supportNotes ?? "");
  const [isResolved, setIsResolved] = useState(thread.resolved);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [replySent, setReplySent] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages]);

  async function sendReply() {
    const text = replyText.trim();
    if (!text) return;
    setIsSendingReply(true);
    setReplySent(false);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/support/${thread.threadId}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ message: text }),
        },
      );
      if (!res.ok) throw new Error();
      setReplyText("");
      setReplySent(true);
      // Refetch thread to get confirmed messages
      const threadRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/support/${thread.threadId}`,
        {
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      const data = await threadRes.json();
      if (data.status === "success") {
        setMessages(data.thread.messages ?? []);
      }
    } finally {
      setIsSendingReply(false);
    }
  }

  async function saveNotes() {
    setIsSavingNotes(true);
    setNotesSaved(false);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/support/${thread.threadId}/notes`,
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

  async function resolveThread() {
    setIsResolving(true);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/support/${thread.threadId}/resolve`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ notes: notesText || undefined }),
        },
      );
      setIsResolved(true);
    } finally {
      setIsResolving(false);
    }
  }

  function copyUrl() {
    navigator.clipboard.writeText(chatUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendReply();
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      <BackButton
        text={t("back")}
        onClick={() => router.push("/support")}
      />

      {/* ── Thread header ─────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-col gap-3 pb-4 border-b border-neutral-100">
        <div className="flex items-center gap-4 flex-wrap justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="font-primary font-medium text-[2.6rem] leading-12">
              {thread.fullName}
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
            {formatDate(thread.createdAt, locale, "local")}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-[1.4rem] text-neutral-600">
            <span className="text-neutral-400">{t("detail.email")}: </span>
            {thread.email}
          </p>
          <p className="text-[1.4rem] text-neutral-600">
            <span className="text-neutral-400">{t("detail.subject")}: </span>
            <span className="font-medium">{thread.subject}</span>
          </p>
        </div>

        {/* Chat URL */}
        {chatUrl && (
          <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 rounded-[1rem] px-4 py-3 mt-1">
            <span className="text-[1.2rem] text-neutral-400 shrink-0">
              {t("detail.chat_link")}:
            </span>
            <a
              href={chatUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[1.3rem] text-primary-500 underline truncate flex-1"
            >
              {chatUrl}
            </a>
            <button
              onClick={copyUrl}
              className="shrink-0 text-[1.2rem] font-medium text-neutral-600 hover:text-primary-500 transition-colors px-3 py-1 bg-neutral-100 rounded-[3rem] cursor-pointer"
            >
              {copied ? t("detail.copied") : t("detail.copy")}
            </button>
          </div>
        )}
      </div>

      {/* ── Main split: messages (left) + actions (right) ─────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">

        {/* Left: conversation ──────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-h-0 gap-3">
          <span className="text-[1.2rem] font-medium text-neutral-400 uppercase tracking-wide shrink-0">
            {t("detail.conversation")}
          </span>

          <div className="flex-1 overflow-y-auto flex flex-col gap-5 pr-1 min-h-[200px]">
            {messages.length === 0 ? (
              <p className="text-[1.4rem] text-neutral-400 text-center py-8">
                {t("detail.no_messages")}
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.messageId}
                  className={`flex flex-col gap-1 ${
                    msg.sender === "admin" ? "items-end" : "items-start"
                  }`}
                >
                  <span className="text-[1.2rem] text-neutral-400 px-2">
                    {msg.sender === "admin"
                      ? t("detail.admin_label")
                      : thread.fullName}
                  </span>
                  <div
                    className={`px-5 py-3 text-[1.4rem] leading-8 max-w-[75%] whitespace-pre-wrap break-words ${
                      msg.sender === "admin"
                        ? "bg-primary-500 text-white rounded-[1.5rem] rounded-br-[0.4rem]"
                        : "bg-neutral-100 text-neutral-900 rounded-[1.5rem] rounded-bl-[0.4rem]"
                    }`}
                  >
                    {msg.message}
                  </div>
                  <span className="text-[1.1rem] text-neutral-400 px-2">
                    {formatDate(msg.createdAt, locale, "local")}
                  </span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Right: reply + notes + resolve ──────────────────────────────────── */}
        <div className="flex flex-col gap-6 lg:w-[320px] xl:w-[360px] shrink-0 overflow-y-auto pb-4">

          {/* Reply */}
          {!isResolved && (
            <div className="flex flex-col gap-3">
              <span className="text-[1.2rem] font-medium text-neutral-400 uppercase tracking-wide">
                {t("detail.reply")}
              </span>
              <textarea
                className="w-full rounded-[1rem] border border-neutral-200 bg-neutral-50 p-4 text-[1.4rem] text-neutral-900 leading-8 resize-none focus:outline-none focus:border-primary-500 transition-colors"
                rows={4}
                placeholder={t("detail.reply_placeholder")}
                value={replyText}
                disabled={isSendingReply}
                onChange={(e) => {
                  setReplyText(e.target.value);
                  setReplySent(false);
                }}
                onKeyDown={handleKeyDown}
              />
              <div className="flex justify-end">
                <button
                  onClick={sendReply}
                  disabled={isSendingReply || !replyText.trim()}
                  className="bg-primary-500 hover:bg-primary-600 text-white text-[1.3rem] font-medium px-6 py-[0.6rem] rounded-[3rem] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSendingReply
                    ? "..."
                    : replySent
                      ? "✓ Sent"
                      : t("detail.send_reply")}
                </button>
              </div>
            </div>
          )}

          {/* Internal notes */}
          <div className="flex flex-col gap-3">
            <span className="text-[1.2rem] font-medium text-neutral-400 uppercase tracking-wide">
              {t("detail.notes")}
            </span>
            <textarea
              className="w-full rounded-[1rem] border border-neutral-200 bg-neutral-50 p-4 text-[1.4rem] text-neutral-900 leading-8 resize-none focus:outline-none focus:border-primary-500 transition-colors"
              rows={3}
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

          {/* Resolve / Resolved */}
          <div className="bg-neutral-100 h-px" />
          {isResolved ? (
            <div className="flex items-center justify-center py-4 border border-[#349C2E]/20 rounded-[1rem] bg-[#349C2E]/5">
              <span className="text-[1.4rem] font-semibold text-[#349C2E]">
                {t("detail.resolved_badge")}
              </span>
            </div>
          ) : (
            <button
              onClick={resolveThread}
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
