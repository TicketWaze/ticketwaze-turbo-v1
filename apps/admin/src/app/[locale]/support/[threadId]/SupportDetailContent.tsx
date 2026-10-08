"use client";
import React, { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Copy, InfoCircle, Send2, TickCircle } from "iconsax-reactjs";
import SettingsHeader from "@/components/shared/SettingsHeader";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Reveal } from "@/components/shared/motion";
import { CARD, HEADER_PILL, PILL_TONE } from "@/components/shared/DataTable";
import formatDateTime from "@/lib/formatDateTime";
import { cn } from "@/lib/utils";
import {
  ThreadBadge,
  type SupportThread,
  type SupportMessage,
} from "../SupportPageContent";
import { getSocket } from "@/hooks/useSocket";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export type SupportThreadDetail = SupportThread & {
  messages: SupportMessage[];
};

/**
 * One live-chat thread. The page does not scroll: the conversation does, with
 * the composer pinned under it. Accept / Mark as resolved / Reopen sit in the
 * header; the thread's details and internal notes are a side column on
 * desktop and a bottom drawer ("Details") on phones.
 */
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

  const [messages, setMessages] = useState<SupportMessage[]>(thread.messages ?? []);
  const [replyText, setReplyText] = useState("");
  const [notesText, setNotesText] = useState(thread.supportNotes ?? "");
  const [savedNotes, setSavedNotes] = useState(thread.supportNotes ?? "");
  const [isResolved, setIsResolved] = useState(thread.resolved);
  const [isAccepted, setIsAccepted] = useState(thread.accepted);
  const [busy, setBusy] = useState<null | "reply" | "notes" | "resolve" | "reopen" | "accept">(
    null,
  );
  const [copied, setCopied] = useState(false);
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant", block: "nearest" });
  }, [messages, isCustomerTyping]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit("admin:join:thread", {
      token: accessToken,
      threadId: thread.threadId,
    });

    const onThreadReopened = () => setIsResolved(false);
    const onTypingStart = ({ sender }: { sender: "customer" | "admin" }) => {
      if (sender === "customer") setIsCustomerTyping(true);
    };
    const onTypingStop = ({ sender }: { sender: "customer" | "admin" }) => {
      if (sender === "customer") setIsCustomerTyping(false);
    };
    const onMessageNew = (msg: SupportMessage) => {
      setMessages((prev) =>
        prev.some((m) => m.messageId === msg.messageId) ? prev : [...prev, msg],
      );
    };

    socket.on("message:new", onMessageNew);
    socket.on("thread:reopened", onThreadReopened);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);

    return () => {
      socket.off("message:new", onMessageNew);
      socket.off("thread:reopened", onThreadReopened);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [thread.threadId, accessToken]);

  function emitTypingStart() {
    const socket = getSocket();
    socket.emit("typing:start", { threadId: thread.threadId, sender: "admin" });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", { threadId: thread.threadId, sender: "admin" });
    }, 1000);
  }

  function emitTypingStop() {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    getSocket().emit("typing:stop", { threadId: thread.threadId, sender: "admin" });
  }

  /** One call to the thread's admin API; false (and a toast) when it fails. */
  async function call(
    action: NonNullable<typeof busy>,
    path: string,
    method: "POST" | "PATCH",
    body?: object,
  ) {
    setBusy(action);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/support/${thread.threadId}/${path}`,
      {
        method,
        headers: {
          ...(body ? { "Content-Type": "application/json" } : {}),
          Authorization: `Bearer ${accessToken}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      },
    ).catch(() => null);
    setBusy(null);
    if (!response?.ok) toast.error(t("detail.error"));
    return Boolean(response?.ok);
  }

  async function sendReply() {
    const text = replyText.trim();
    if (!text || busy) return;
    emitTypingStop();
    // The new message arrives back over the socket (message:new).
    if (await call("reply", "reply", "POST", { message: text })) setReplyText("");
  }

  async function saveNotes() {
    if (await call("notes", "notes", "PATCH", { notes: notesText })) {
      setSavedNotes(notesText);
      toast.success(t("detail.notes_saved"));
    }
  }

  async function resolveThread() {
    if (await call("resolve", "resolve", "PATCH", { notes: notesText || undefined })) {
      setIsResolved(true);
      setSavedNotes(notesText);
    }
  }

  async function reopenThread() {
    if (await call("reopen", "reopen", "PATCH")) setIsResolved(false);
  }

  async function acceptThread() {
    if (await call("accept", "accept", "PATCH")) setIsAccepted(true);
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

  const label = "text-[1.3rem] leading-7 text-neutral-600";

  const headerAction = !isAccepted ? (
    <button
      type="button"
      onClick={acceptThread}
      disabled={busy !== null}
      className={cn(HEADER_PILL, PILL_TONE.primary)}
    >
      {busy === "accept" ? <LoadingCircleSmall /> : t("detail.accept")}
    </button>
  ) : isResolved ? (
    <button
      type="button"
      onClick={reopenThread}
      disabled={busy !== null}
      className={cn(HEADER_PILL, PILL_TONE.neutral)}
    >
      {busy === "reopen" ? <LoadingCircleSmall /> : t("detail.mark_open")}
    </button>
  ) : (
    <button
      type="button"
      onClick={resolveThread}
      disabled={busy !== null}
      className={cn(HEADER_PILL, PILL_TONE.success)}
    >
      {busy === "resolve" ? <LoadingCircleSmall /> : t("detail.mark_resolved")}
    </button>
  );

  // The details and notes: the right column on desktop, the drawer on phones.
  const sidePanel = (
    <div className="flex flex-col gap-6">
      <div className={cn(CARD, "flex flex-col gap-6")}>
        <div className="flex flex-col gap-1 min-w-0">
          <span className={label}>{t("detail.email")}</span>
          <a
            href={`mailto:${thread.email}`}
            className="text-[1.5rem] text-primary-500 truncate hover:underline"
          >
            {thread.email}
          </a>
        </div>
        <div className="flex flex-col gap-1">
          <span className={label}>{t("detail.subject")}</span>
          <span className="text-[1.5rem] text-deep-100 break-words">{thread.subject}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className={label}>{t("detail.started")}</span>
          <span className="text-[1.5rem] text-deep-100">
            {formatDateTime(thread.createdAt, locale)}
          </span>
        </div>
        {chatUrl && (
          <div className="flex flex-col gap-2">
            <span className={label}>{t("detail.chat_link")}</span>
            <div className="flex items-center gap-3 bg-neutral-100 rounded-[3rem] pl-5 pr-2 py-2">
              <a
                href={chatUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[1.3rem] text-primary-500 truncate flex-1 hover:underline"
              >
                {chatUrl}
              </a>
              <button
                type="button"
                onClick={copyUrl}
                aria-label={t("detail.copy")}
                title={copied ? t("detail.copied") : t("detail.copy")}
                className="shrink-0 w-[3.2rem] h-[3.2rem] rounded-full bg-white flex items-center justify-center cursor-pointer"
              >
                {copied ? (
                  <TickCircle size="16" variant="Bulk" color="#349C2E" />
                ) : (
                  <Copy size="16" variant="Bulk" color="#737C8A" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={cn(CARD, "flex flex-col gap-4")}>
        <div className="flex flex-col gap-1">
          <span className="font-primary font-medium text-[1.6rem] leading-9 text-black">
            {t("detail.notes")}
          </span>
          <span className={label}>{t("detail.notes_hint")}</span>
        </div>
        <textarea
          className="w-full rounded-[1rem] bg-neutral-100 p-5 text-[1.4rem] leading-8 text-deep-100 resize-none outline-none focus:ring-2 focus:ring-primary-200 transition-shadow"
          rows={4}
          maxLength={5000}
          placeholder={t("detail.notes_placeholder")}
          value={notesText}
          onChange={(e) => setNotesText(e.target.value)}
        />
        <button
          type="button"
          onClick={saveNotes}
          disabled={busy !== null || notesText === savedNotes}
          className={cn(HEADER_PILL, PILL_TONE.neutral, "w-full lg:w-full")}
        >
          {busy === "notes" ? <LoadingCircleSmall /> : t("detail.save_notes")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      <SettingsHeader
        title={thread.fullName}
        back={{ href: "/support", label: t("title") }}
        actions={
          <div className="flex items-center gap-[1rem] w-full lg:w-auto">
            <ThreadBadge thread={{ resolved: isResolved, accepted: isAccepted }} />
            {headerAction}
            <Drawer direction="bottom">
              <DrawerTrigger asChild>
                <button
                  type="button"
                  className={cn(HEADER_PILL, PILL_TONE.neutral, "lg:hidden")}
                >
                  {t("detail.details")}
                </button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[85dvh]">
                <DrawerHeader className="px-6 pt-4 pb-2">
                  <DrawerTitle className="text-[1.6rem] font-primary">
                    {thread.fullName}
                  </DrawerTitle>
                </DrawerHeader>
                <div className="overflow-y-auto px-6 pb-8">{sidePanel}</div>
              </DrawerContent>
            </Drawer>
          </div>
        }
      />

      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0 pb-4">
        {/* Conversation, with the composer pinned under it. */}
        <Reveal className={cn(CARD, "flex flex-col flex-1 min-h-0 min-w-0 p-0 overflow-hidden")}>
          <div className="flex-1 overflow-y-auto flex flex-col gap-5 p-8 min-h-0">
            {messages.length === 0 ? (
              <p className="text-[1.4rem] text-neutral-600 text-center py-8">
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
                    className={cn(
                      "flex flex-col gap-1",
                      msg.sender === "admin" ? "items-end" : "items-start",
                    )}
                  >
                    <span className="text-[1.2rem] text-neutral-600 px-2">
                      {msg.sender === "admin" ? t("detail.admin_label") : thread.fullName}
                    </span>
                    <div
                      className={cn(
                        "px-5 py-3 text-[1.4rem] leading-8 max-w-[80%] lg:max-w-[75%] whitespace-pre-wrap wrap-break-word",
                        msg.sender === "admin"
                          ? "bg-primary-500 text-white rounded-[1.5rem] rounded-br-[0.4rem]"
                          : "bg-neutral-100 text-deep-100 rounded-[1.5rem] rounded-bl-[0.4rem]",
                      )}
                    >
                      {msg.message}
                    </div>
                    <span className="text-[1.1rem] text-neutral-500 px-2">
                      {formatDateTime(msg.createdAt, locale)}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            <AnimatePresence>
              {isCustomerTyping && (
                <motion.div
                  key="customer-typing"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col gap-1 items-start"
                >
                  <span className="text-[1.2rem] text-neutral-600 px-2">{thread.fullName}</span>
                  <div className="bg-neutral-100 rounded-[1.5rem] rounded-bl-[0.4rem] px-5 py-4 flex items-center gap-[6px]">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-[0.5rem] h-[0.5rem] bg-neutral-500 rounded-full inline-block"
                        animate={{ y: [0, -4, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.7,
                          delay: i * 0.13,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 border-t border-neutral-100 p-4">
            {!isAccepted || isResolved ? (
              <p className="flex items-center justify-center gap-3 py-3 text-[1.4rem] text-neutral-600 text-center">
                <InfoCircle size="18" variant="Bulk" color="#737C8A" className="shrink-0" />
                {isResolved ? t("detail.resolved_hint") : t("detail.accept_hint")}
              </p>
            ) : (
              <div className="flex gap-3 items-end">
                <textarea
                  className="flex-1 rounded-[1.5rem] bg-neutral-100 px-5 py-4 text-[1.4rem] text-deep-100 leading-8 resize-none outline-none focus:ring-2 focus:ring-primary-200 transition-shadow"
                  rows={2}
                  placeholder={t("detail.reply_placeholder")}
                  aria-label={t("detail.reply")}
                  value={replyText}
                  disabled={busy === "reply"}
                  onChange={(e) => {
                    setReplyText(e.target.value);
                    emitTypingStart();
                  }}
                  onBlur={emitTypingStop}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="button"
                  onClick={sendReply}
                  aria-label={t("detail.send_reply")}
                  disabled={busy !== null || !replyText.trim()}
                  className="shrink-0 w-[4.8rem] h-[4.8rem] rounded-full bg-primary-500 hover:bg-primary-600 flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {busy === "reply" ? (
                    <LoadingCircleSmall />
                  ) : (
                    <Send2 size="20" variant="Bulk" color="#ffffff" />
                  )}
                </button>
              </div>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.05} className="hidden lg:block lg:w-[32rem] xl:w-[36rem] shrink-0 overflow-y-auto">
          {sidePanel}
        </Reveal>
      </div>
    </div>
  );
}
