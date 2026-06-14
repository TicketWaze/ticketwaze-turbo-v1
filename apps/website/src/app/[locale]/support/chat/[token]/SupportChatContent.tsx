"use client";
import React, { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "motion/react";
import Navbar from "@/components/Navbar";
import LoadingCircleSmall from "@/components/LoadingCircleSmall";
import { Link } from "@/i18n/navigation";

export type SupportMessage = {
  messageId: string;
  sender: "customer" | "admin";
  message: string;
  createdAt: string;
};

export type SupportThread = {
  threadId: string;
  fullName: string;
  subject: string;
  resolved: boolean;
  createdAt: string;
  messages: SupportMessage[];
};

function formatDate(dateStr: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

function formatTime(dateStr: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export default function SupportChatContent({
  token,
  initialThread,
}: {
  token: string;
  initialThread: SupportThread | null;
}) {
  const t = useTranslations("SupportChat");
  const locale = useLocale();

  const [messages, setMessages] = useState<SupportMessage[]>(
    initialThread?.messages ?? [],
  );
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = inputText.trim();
    if (!text || isSending) return;

    setSendError(false);

    const optimistic: SupportMessage = {
      messageId: `opt-${Date.now()}`,
      sender: "customer",
      message: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setInputText("");
    setIsSending(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/support/chat/${token}/message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            origin: process.env.NEXT_PUBLIC_WEBSITE_URL ?? "",
            "Accept-Language": locale,
          },
          body: JSON.stringify({ message: text }),
        },
      );

      if (!res.ok) throw new Error();

      const threadRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/support/chat/${token}`,
        {
          headers: {
            origin: process.env.NEXT_PUBLIC_WEBSITE_URL ?? "",
            "Accept-Language": locale,
          },
        },
      );
      const data = await threadRes.json();
      if (data.status === "success") {
        setMessages(data.thread.messages);
      }
    } catch {
      setSendError(true);
      setMessages((prev) => prev.filter((m) => m.messageId !== optimistic.messageId));
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (!initialThread) {
    return (
      <section className="bg-white py-[2.5rem] px-4 lg:px-0 rounded-[3rem] flex flex-col gap-[6rem]">
        <Navbar />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-8 px-[1.5rem] lg:px-[10rem] py-[6rem]"
        >
          <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
              <span className="text-[2rem]">✉</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 text-center max-w-[480px]">
            <h1 className="font-primary font-bold text-[2.8rem] lg:text-[4rem] leading-tight text-neutral-900">
              {t("error")}
            </h1>
            <p className="text-[1.5rem] leading-8 text-neutral-500 font-sans">
              {t("error_description")}
            </p>
          </div>
          <Link
            href="/contact"
            className="px-12 py-6 rounded-[10rem] bg-primary-500 text-white text-[1.5rem] font-medium leading-8 hover:bg-primary-500/90 transition-colors"
          >
            {t("error_back")}
          </Link>
        </motion.div>
      </section>
    );
  }

  const thread = initialThread;

  // ── Chat UI ─────────────────────────────────────────────────────────────────
  return (
    <section className="bg-white rounded-[3rem] h-screen flex flex-col overflow-hidden">

      {/* Navbar */}
      <div className="shrink-0 py-[2.5rem] px-4 lg:px-[10rem]">
        <Navbar />
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-1 min-h-0 px-4 lg:px-[10rem] pb-[3rem] gap-8 lg:gap-12"
      >

        {/* ── LEFT: Thread details (desktop only) ─────────────────────────── */}
        <div className="hidden lg:flex flex-col gap-6 w-[260px] xl:w-[300px] shrink-0 overflow-y-auto">

          {/* Subject + status */}
          <div className="flex flex-col gap-3">
            <h1 className="font-primary font-semibold text-[2.4rem] leading-tight text-neutral-900">
              {thread.subject}
            </h1>
            {thread.resolved ? (
              <span className="self-start py-[0.3rem] px-4 text-[1.1rem] font-bold uppercase text-[#349C2E] rounded-[30px] bg-[#349C2E]/10">
                {t("closed_badge")}
              </span>
            ) : (
              <span className="self-start py-[0.3rem] px-4 text-[1.1rem] font-bold uppercase text-primary-500 rounded-[30px] bg-primary-500/10">
                {t("open_badge")}
              </span>
            )}
          </div>

          <div className="h-px bg-neutral-100" />

          {/* Sender info */}
          <div className="flex flex-col gap-2">
            <p className="text-[1.4rem] font-medium text-neutral-800 font-sans">
              {thread.fullName}
            </p>
            <p className="text-[1.3rem] text-neutral-400 font-sans">
              {t("started")} {formatDate(thread.createdAt, locale)}
            </p>
          </div>

          <div className="h-px bg-neutral-100" />

          {/* Support note */}
          <p className="text-[1.3rem] text-neutral-400 font-sans leading-7">
            {t("team_note")}
          </p>
        </div>

        {/* ── RIGHT: Chat panel ────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0 lg:pl-8 lg:border-l lg:border-neutral-100">

          {/* Mobile-only header */}
          <div className="lg:hidden shrink-0 flex flex-col gap-2 pb-5 border-b border-neutral-100 mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-primary font-medium text-[2rem] leading-tight text-neutral-900">
                {thread.subject}
              </h1>
              {thread.resolved ? (
                <span className="py-[0.3rem] px-3 text-[1.1rem] font-bold uppercase text-[#349C2E] rounded-[30px] bg-[#349C2E]/10">
                  {t("closed_badge")}
                </span>
              ) : (
                <span className="py-[0.3rem] px-3 text-[1.1rem] font-bold uppercase text-primary-500 rounded-[30px] bg-primary-500/10">
                  {t("open_badge")}
                </span>
              )}
            </div>
            <p className="text-[1.3rem] text-neutral-400 font-sans">
              {thread.fullName} · {t("started")} {formatDate(thread.createdAt, locale)}
            </p>
          </div>

          {/* Scrollable messages */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-6 pr-2 py-2">
            {messages.length === 0 ? (
              <p className="text-[1.5rem] text-neutral-400 font-sans text-center py-12">
                {t("empty")}
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.messageId}
                  className={`flex flex-col gap-1 ${
                    msg.sender === "customer" ? "items-end" : "items-start"
                  }`}
                >
                  <span className="text-[1.2rem] text-neutral-400 font-sans px-2">
                    {msg.sender === "customer" ? t("you") : t("support_team")}
                  </span>
                  <div
                    className={`px-6 py-4 text-[1.5rem] leading-8 max-w-[80%] lg:max-w-[65%] whitespace-pre-wrap break-words font-sans ${
                      msg.sender === "customer"
                        ? "bg-primary-500 text-white rounded-[2rem] rounded-br-[0.5rem]"
                        : "bg-neutral-100 text-neutral-900 rounded-[2rem] rounded-bl-[0.5rem]"
                    }`}
                  >
                    {msg.message}
                  </div>
                  <span className="text-[1.1rem] text-neutral-400 font-sans px-2">
                    {formatTime(msg.createdAt, locale)}
                  </span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input / Closed notice — pinned to bottom */}
          <div className="shrink-0 pt-4">
            {thread.resolved ? (
              <div className="bg-[#349C2E]/10 border border-[#349C2E]/20 rounded-[1.5rem] px-8 py-6 flex flex-col gap-2 text-center">
                <p className="text-[1.5rem] font-medium text-[#349C2E] font-primary">
                  {t("closed")}
                </p>
                <p className="text-[1.4rem] text-[#349C2E]/70 font-sans">
                  {t("closed_description")}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {sendError && (
                  <p className="text-failure text-[1.2rem] pl-2 font-primary leading-8">
                    {t("error_send")}
                  </p>
                )}
                <div className="flex gap-4 items-end">
                  <textarea
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      setSendError(false);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={t("placeholder")}
                    rows={2}
                    disabled={isSending}
                    className="flex-1 p-6 bg-neutral-100 rounded-[1.5rem] text-[1.5rem] leading-8 resize-none focus:outline-none placeholder:text-neutral-600 text-black disabled:opacity-60"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isSending || !inputText.trim()}
                    className="px-10 py-6 rounded-[10rem] bg-primary-500 text-white text-[1.5rem] font-medium leading-8 cursor-pointer disabled:cursor-not-allowed disabled:bg-primary-500/50 flex items-center justify-center min-w-[10rem] shrink-0"
                  >
                    {isSending ? <LoadingCircleSmall /> : t("send")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
