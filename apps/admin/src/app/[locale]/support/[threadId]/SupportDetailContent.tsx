"use client";
import React, { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "@/i18n/navigation";
import BackButton from "@/components/shared/BackButton";
import formatDate from "@/lib/FormatDate";
import { type SupportThread, type SupportMessage } from "../SupportPageContent";
import { getSocket } from "@/hooks/useSocket";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Send2 } from "iconsax-reactjs";

function formatTime(dateStr: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

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
  const [isReopening, setIsReopening] = useState(false);
  const [replySent, setReplySent] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit("admin:join:thread", {
      token: accessToken,
      threadId: thread.threadId,
    });

    const onThreadReopened = () => setIsResolved(false);

    const onMessageNew = (msg: {
      messageId: string;
      sender: "customer" | "admin";
      message: string;
      createdAt: string;
    }) => {
      setMessages((prev) => {
        if (prev.some((m) => m.messageId === msg.messageId)) return prev;
        return [...prev, msg];
      });
    };

    socket.on("message:new", onMessageNew);
    socket.on("thread:reopened", onThreadReopened);

    return () => {
      socket.off("message:new", onMessageNew);
      socket.off("thread:reopened", onThreadReopened);
    };
  }, [thread.threadId, accessToken]);

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

  async function reopenThread() {
    setIsReopening(true);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/support/${thread.threadId}/reopen`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      setIsResolved(false);
    } finally {
      setIsReopening(false);
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

  // ── Shared: actions panel content (used in both drawer and desktop sidebar) ──
  const ActionsPanel = (
    <div className="flex flex-col gap-6 pb-4">
      {/* Thread meta */}
      <div className="flex flex-col gap-1">
        <p className="text-[1.4rem] text-neutral-600">
          <span className="text-neutral-400">{t("detail.email")}: </span>
          {thread.email}
        </p>
        <p className="text-[1.4rem] text-neutral-600">
          <span className="text-neutral-400">{t("detail.subject")}: </span>
          <span className="font-medium">{thread.subject}</span>
        </p>
        <p className="text-[1.4rem] text-neutral-600">
          <span className="text-neutral-400">
            {t("detail.date") ?? "Date"}:{" "}
          </span>
          {formatDate(thread.createdAt, locale, "local")}
        </p>
      </div>

      {/* Chat URL */}
      {chatUrl && (
        <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3">
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

      {/* Internal notes */}
      <div className="flex flex-col gap-3">
        <span className="text-[1.2rem] font-medium text-neutral-400 uppercase tracking-wide">
          {t("detail.notes")}
        </span>
        <textarea
          className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-[1.4rem] text-neutral-900 leading-8 resize-none focus:outline-none focus:border-primary-500 transition-colors"
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

      {/* Resolve / Reopen */}
      <div className="bg-neutral-100 h-px" />
      {isResolved ? (
        <button
          onClick={reopenThread}
          disabled={isReopening}
          className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[1.4rem] font-semibold py-4 rounded-2xl transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isReopening ? "..." : t("detail.mark_open")}
        </button>
      ) : (
        <button
          onClick={resolveThread}
          disabled={isResolving}
          className="w-full bg-[#349C2E]/10 hover:bg-[#349C2E]/20 text-[#349C2E] text-[1.4rem] font-semibold py-4 rounded-2xl transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isResolving ? "..." : t("detail.mark_resolved")}
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      <BackButton text={t("back")} onClick={() => router.push("/support")} />

      {/* ── Thread header ──────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-col gap-2 pb-4 border-b border-neutral-100">
        {/* Row: name + status + date + actions trigger */}
        <div className="flex items-start gap-3 justify-between">
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <h2 className="font-primary font-medium text-[2.2rem] lg:text-[2.6rem] leading-tight truncate">
              {thread.fullName}
            </h2>
            {isResolved ? (
              <span className="shrink-0 py-[0.3rem] text-[1.1rem] font-bold leading-6 uppercase text-[#349C2E] px-2 rounded-[30px] bg-[#f5f5f5]">
                {t("status.resolved")}
              </span>
            ) : (
              <span className="shrink-0 py-[0.3rem] text-[1.1rem] font-bold leading-6 uppercase text-[#EA961C] px-2 rounded-[30px] bg-[#f5f5f5]">
                {t("status.open")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden lg:block text-[1.3rem] text-neutral-500">
              {formatDate(thread.createdAt, locale, "local")}
            </span>

            {/* Mobile Actions drawer trigger */}
            <Drawer direction="bottom">
              <DrawerTrigger asChild>
                <button className="lg:hidden flex items-center gap-2 px-4 py-[0.6rem] bg-neutral-100 hover:bg-neutral-200 rounded-[3rem] text-[1.3rem] font-medium text-neutral-700 transition-colors cursor-pointer">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                  {t("detail.actions") ?? "Actions"}
                </button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[85dvh]">
                <DrawerHeader className="px-6 pt-4 pb-2">
                  <DrawerTitle className="text-[1.6rem] font-primary">
                    {thread.fullName}
                  </DrawerTitle>
                </DrawerHeader>
                <div className="overflow-y-auto px-6 pb-8">{ActionsPanel}</div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>

      {/* ── Main split ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Conversation ────────────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-h-0 gap-3">
          <span className="text-[1.2rem] font-medium text-neutral-400 uppercase tracking-wide shrink-0">
            {t("detail.conversation")}
          </span>

          <div className="flex-1 overflow-y-auto flex flex-col gap-5 pr-1 min-h-0">
            {messages.length === 0 ? (
              <p className="text-[1.4rem] text-neutral-400 text-center py-8">
                {t("detail.no_messages")}
              </p>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.messageId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className={`flex flex-col gap-1 ${msg.sender === "admin" ? "items-end" : "items-start"}`}
                  >
                    <span className="text-[1.2rem] text-neutral-400 px-2">
                      {msg.sender === "admin"
                        ? t("detail.admin_label")
                        : thread.fullName}
                    </span>
                    <div
                      className={`px-5 py-3 text-[1.4rem] leading-8 max-w-[80%] lg:max-w-[75%] whitespace-pre-wrap wrap-break-word ${
                        msg.sender === "admin"
                          ? "bg-primary-500 text-white rounded-3xl rounded-br-[0.4rem]"
                          : "bg-neutral-100 text-neutral-900 rounded-3xl rounded-bl-[0.4rem]"
                      }`}
                    >
                      {msg.message}
                    </div>
                    <span className="text-[1.1rem] text-neutral-400 px-2">
                      {formatDate(msg.createdAt, locale, "local")} ·{" "}
                      {formatTime(msg.createdAt, locale)}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply — pinned below the conversation on all screen sizes */}
          <div className="shrink-0 pt-3 border-t border-neutral-100">
            {isResolved ? (
              <div className="flex items-center justify-center gap-3 py-3 rounded-2xl bg-[#349C2E]/5 border border-[#349C2E]/20">
                <span className="text-[1.3rem] font-medium text-[#349C2E]">
                  {t("status.resolved")}
                </span>
                <button
                  onClick={reopenThread}
                  disabled={isReopening}
                  className="text-[1.2rem] font-medium text-neutral-500 underline disabled:opacity-50 cursor-pointer"
                >
                  {isReopening ? "..." : t("detail.mark_open")}
                </button>
              </div>
            ) : (
              <div className="flex gap-3 items-end">
                <textarea
                  className="flex-1 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-[1.4rem] text-neutral-900 leading-8 resize-none focus:outline-none focus:border-primary-500 transition-colors"
                  rows={2}
                  placeholder={t("detail.reply_placeholder")}
                  value={replyText}
                  disabled={isSendingReply}
                  onChange={(e) => {
                    setReplyText(e.target.value);
                    setReplySent(false);
                  }}
                  onKeyDown={handleKeyDown}
                />
                <button
                  onClick={sendReply}
                  disabled={isSendingReply || !replyText.trim()}
                  className="shrink-0 bg-primary-500 text-white px-6 py-4 rounded-2xl text-[1.3rem] font-medium disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  {isSendingReply ? "..." : replySent ? "✓" : <Send2 />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop right panel ─────────────────────────────────────────────── */}
        <div className="hidden lg:flex flex-col gap-6 lg:w-[320px] xl:w-90 shrink-0 overflow-y-auto pb-4">
          {ActionsPanel}
        </div>
      </div>
    </div>
  );
}
