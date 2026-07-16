"use client";
import { usePathname } from "@/i18n/navigation";
import LiveChatWidget from "./LiveChatWidget";

// Temporarily disabled. Flip back to `true` to re-enable the live chat widget
// site-wide. The widget code is left untouched so this is a one-line reversal.
const LIVE_CHAT_ENABLED = false;

export default function LiveChatWidgetMount() {
  const pathname = usePathname();
  if (!LIVE_CHAT_ENABLED) return null;
  if (pathname.includes("/support/chat/")) return null;
  return <LiveChatWidget />;
}
