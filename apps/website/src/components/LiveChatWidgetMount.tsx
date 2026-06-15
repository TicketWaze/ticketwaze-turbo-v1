"use client";
import { usePathname } from "@/i18n/navigation";
import LiveChatWidget from "./LiveChatWidget";

export default function LiveChatWidgetMount() {
  const pathname = usePathname();
  if (pathname.includes("/support/chat/")) return null;
  return <LiveChatWidget />;
}
