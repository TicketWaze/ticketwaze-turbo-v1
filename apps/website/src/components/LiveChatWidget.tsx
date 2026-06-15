"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

type Step = "name" | "email" | "subject" | "message" | "connecting" | "done";

type ChatMsg = {
  id: string;
  sender: "bot" | "user";
  text: string;
  quickReplies?: Array<{ label: string; value: string }>;
};

let _msgId = 0;
const uid = () => `m${++_msgId}`;

const pause = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

export default function LiveChatWidget() {
  const t = useTranslations("LiveChat");
  const locale = useLocale();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [step, setStep] = useState<Step>("name");
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const hasStartedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const subjects = [
    { label: t("subjects.general"), value: "General questions" },
    { label: t("subjects.account"), value: "Account related issues" },
    { label: t("subjects.activity"), value: "Activity help" },
    { label: t("subjects.ticketing"), value: "Ticketing" },
    { label: t("subjects.technical"), value: "Technical support" },
    { label: t("subjects.media"), value: "Media" },
    { label: t("subjects.partnerships"), value: "Partnerships" },
    { label: t("subjects.business"), value: "Business collaborations" },
    { label: t("subjects.non_urgent"), value: "Non-urgent concerns." },
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Start conversation once on first open
  useEffect(() => {
    if (!open) return;
    if (hasStartedRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
      return;
    }
    hasStartedRef.current = true;

    (async () => {
      await addBot(t("bot.welcome"), undefined, 700);
      await addBot(t("bot.ask_name"), undefined, 1000);
      setTimeout(() => inputRef.current?.focus(), 100);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function addBot(
    text: string,
    quickReplies?: Array<{ label: string; value: string }>,
    ms = 900,
  ) {
    setIsTyping(true);
    await pause(ms);
    setIsTyping(false);
    setMessages((prev) => [
      ...prev,
      { id: uid(), sender: "bot", text, quickReplies },
    ]);
  }

  async function handleSend() {
    const text = inputValue.trim();
    if (!text || isTyping || step === "connecting" || step === "done") return;
    setInputValue("");

    setMessages((prev) => [...prev, { id: uid(), sender: "user", text }]);

    if (step === "name") {
      if (text.length < 2) {
        await addBot(t("bot.name_too_short"), undefined, 600);
        return;
      }
      if (text.length > 100) {
        await addBot(t("bot.name_too_long"), undefined, 600);
        return;
      }
      setUserData((u) => ({ ...u, name: text }));
      setStep("email");
      await addBot(t("bot.got_name", { name: text }));
    } else if (step === "email") {
      if (!isValidEmail(text)) {
        await addBot(t("bot.invalid_email"), undefined, 600);
        return;
      }
      setUserData((u) => ({ ...u, email: text }));
      setStep("subject");
      await addBot(t("bot.ask_subject"), subjects);
    } else if (step === "message") {
      if (text.length < 10) {
        await addBot(t("bot.message_too_short"), undefined, 600);
        return;
      }
      if (text.length > 2000) {
        await addBot(t("bot.message_too_long"), undefined, 600);
        return;
      }
      const updated = { ...userData, message: text };
      setUserData(updated);
      setStep("connecting");
      await connect(updated);
    }
  }

  async function handleQuickReply(value: string, label: string) {
    setMessages((prev) => [
      ...prev,
      { id: uid(), sender: "user", text: label },
    ]);
    setUserData((u) => ({ ...u, subject: value }));
    setStep("message");
    await addBot(t("bot.ask_message"));
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function connect(data: typeof userData) {
    await addBot(t("bot.connecting", { name: data.name }), undefined, 600);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/support/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            origin: process.env.NEXT_PUBLIC_WEBSITE_URL!,
            "Accept-Language": locale,
          },
          body: JSON.stringify({
            fullName: data.name,
            email: data.email,
            subject: data.subject,
            message: data.message,
          }),
        },
      );
      const json = await res.json();

      if (json.status === "success" && json.accessToken) {
        await addBot(t("bot.connected"), undefined, 400);
        setStep("done");
        await pause(1400);
        setOpen(false);
        router.push(`/support/chat/${json.accessToken}`);
      } else {
        throw new Error("api-error");
      }
    } catch {
      setStep("message");
      await addBot(t("bot.error"), undefined, 500);
    }
  }

  const inputDisabled = isTyping || step === "connecting" || step === "done";

  return (
    <>
      {/* ── Floating button ──────────────────────────────────────────────────── */}
      <div className="fixed bottom-10 right-10 z-50 flex items-center justify-center">
        {!open && (
          <span className="absolute h-full w-full rounded-full bg-primary-500/35 animate-ping pointer-events-none" />
        )}
        <motion.button
          onClick={() => setOpen((o) => !o)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          aria-label={t("button")}
          className="relative w-24 h-24 bg-primary-500 text-white rounded-full shadow-xl flex items-center justify-center cursor-pointer"
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span
                key="close"
                initial={{ rotate: -45, opacity: 0, scale: 0.6 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 45, opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.16 }}
                className="text-[2.2rem] leading-none select-none"
              >
                ✕
              </motion.span>
            ) : (
              <motion.span
                key="chat"
                initial={{ rotate: 45, opacity: 0, scale: 0.6 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: -45, opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.16 }}
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ── Chat widget ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-widget"
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 24 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-38 right-10 z-50 w-95 bg-white rounded-4xl shadow-2xl flex flex-col overflow-hidden"
            style={{ height: "520px", maxHeight: "calc(100vh - 11rem)" }}
          >
            {/* Header */}
            <div className="bg-primary-500 px-6 py-5 shrink-0 flex items-center gap-4">
              <div className="w-18 h-18 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <span className="text-white font-primary font-bold text-[1.9rem] leading-none">
                  T
                </span>
              </div>
              <div className="flex-1 flex flex-col gap-[.4rem]">
                <span className="font-primary font-semibold text-white text-[1.6rem] leading-7">
                  {t("title")}
                </span>
                <div className="flex items-center gap-[.6rem]">
                  <motion.span
                    className="w-3 h-3 bg-green-400 rounded-full inline-block"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.2,
                      ease: "easeInOut",
                    }}
                  />
                  <span className="text-white/75 text-[1.2rem] leading-5 font-sans">
                    {t("subtitle")}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4 min-h-0">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className={`flex flex-col gap-4 ${
                      msg.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    {msg.sender === "bot" ? (
                      <div className="flex items-end gap-[8px] max-w-[85%]">
                        <div className="w-[2.6rem] h-[2.6rem] rounded-full bg-primary-500/12 border border-primary-500/20 flex items-center justify-center shrink-0">
                          <span className="text-primary-500 font-primary font-bold text-[1rem] leading-none">
                            T
                          </span>
                        </div>
                        <div className="bg-neutral-100 text-neutral-900 rounded-[1.5rem] rounded-bl-[0.4rem] px-[1.4rem] py-[0.9rem] text-[1.4rem] leading-[1.65] font-sans">
                          {msg.text}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-primary-500 text-white rounded-[1.5rem] rounded-br-[0.4rem] px-[1.4rem] py-[0.9rem] text-[1.4rem] leading-[1.65] max-w-[85%] font-sans">
                        {msg.text}
                      </div>
                    )}

                    {/* Quick-reply chips — only visible while step === "subject" */}
                    {msg.quickReplies && step === "subject" && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: 0.08 }}
                        className="flex flex-wrap gap-2 pl-[3.4rem]"
                      >
                        {msg.quickReplies.map((qr) => (
                          <button
                            key={qr.value}
                            onClick={() => handleQuickReply(qr.value, qr.label)}
                            className="px-[1.2rem] py-[0.45rem] text-[1.25rem] border border-primary-500/50 text-primary-500 rounded-[3rem] hover:bg-primary-500 hover:text-white hover:border-primary-500 transition-colors cursor-pointer font-sans"
                          >
                            {qr.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-end gap-[8px]"
                  >
                    <div className="w-[2.6rem] h-[2.6rem] rounded-full bg-primary-500/12 border border-primary-500/20 flex items-center justify-center shrink-0">
                      <span className="text-primary-500 font-primary font-bold text-[1rem] leading-none">
                        T
                      </span>
                    </div>
                    <div className="bg-neutral-100 rounded-[1.5rem] rounded-bl-[0.4rem] px-[1.4rem] py-[1rem] flex items-center gap-[5px]">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-[0.6rem] h-[0.6rem] bg-neutral-400 rounded-full inline-block"
                          animate={{ y: [0, -5, 0] }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.72,
                            delay: i * 0.13,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={bottomRef} />
            </div>

            {/* Bottom bar */}
            <div className="shrink-0 px-4 py-4 border-t border-neutral-100">
              {step === "connecting" || step === "done" ? (
                /* Connecting pulse */
                <div className="flex items-center justify-center gap-[10px] py-[0.6rem]">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-[0.85rem] h-[0.85rem] bg-primary-500 rounded-full inline-block"
                      animate={{
                        scale: [1, 1.55, 1],
                        opacity: [0.35, 1, 0.35],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.85,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                  <span className="text-[1.3rem] text-neutral-400 font-sans ml-[6px]">
                    {t("connecting")}
                  </span>
                </div>
              ) : step === "subject" ? (
                /* Hint when waiting for a chip selection */
                <p className="text-center text-[1.25rem] text-neutral-400 py-[0.6rem] font-sans select-none">
                  {t("pick_hint")}
                </p>
              ) : (
                /* Text input */
                <div className="flex items-center gap-3">
                  <input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder={
                      step === "name"
                        ? t("placeholder.name")
                        : step === "email"
                          ? t("placeholder.email")
                          : t("placeholder.message")
                    }
                    disabled={inputDisabled}
                    className="flex-1 px-5 py-[0.95rem] bg-neutral-100 rounded-[3rem] text-[1.4rem] leading-7 placeholder:text-neutral-400 text-black focus:outline-none disabled:opacity-50 font-sans"
                  />
                  <motion.button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || inputDisabled}
                    whileTap={{ scale: 0.88 }}
                    className="w-[4.5rem] h-[4.5rem] bg-primary-500 text-white rounded-full flex items-center justify-center disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed shrink-0"
                  >
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
