"use client";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import {
  Calendar,
  CloseCircle,
  Copy,
  Edit2,
  Gift,
  Lock1,
  MoneyRecive,
  Notification,
  ReceiptText,
  RouteSquare,
  ShieldTick,
  Star1,
  Ticket,
  TicketDiscount,
  Timer1,
  Trash,
  UserSquare,
  Wallet,
} from "iconsax-reactjs";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/** Every kind the API writes (app/services/user_notifications.ts). */
const ICONS: Record<string, typeof Ticket> = {
  followed_new_activity: UserSquare,
  interest_new_activity: Ticket,
  offer: TicketDiscount,
  reminder_tomorrow: Calendar,
  reminder_today: Timer1,
  activity_changed: Edit2,
  raffle_changed: Edit2,
  activity_deletion_scheduled: Trash,
  activity_cancelled: CloseCircle,
  rate_activity: Star1,
  purchase_confirmed: ReceiptText,
  ticket_received: Gift,
  giveaway_received: Gift,
  reward_unlocked: Gift,
  ticket_returned: Ticket,
  raffle_entry_confirmed: ReceiptText,
  reservation_confirmed: ReceiptText,
  sale_confirmed: ReceiptText,
  private_invitation: Lock1,
  invitation_revoked: Lock1,
  raffle_won: Star1,
  raffle_result: Star1,
  raffle_cancelled: CloseCircle,
  wallet_credited: MoneyRecive,
  withdrawal_accepted: Wallet,
  withdrawal_rejected: Wallet,
  password_changed: ShieldTick,
  account_deletion_scheduled: ShieldTick,
  account_deletion_reminder: ShieldTick,
  waitlist_tokens: Gift,
};
/** Kinds that are bad news get a neutral icon chip instead of orange. */
const SOMBER = new Set([
  "activity_cancelled",
  "activity_deletion_scheduled",
  "invitation_revoked",
  "raffle_cancelled",
  "withdrawal_rejected",
]);

type UserNotification = {
  notificationId: string;
  kind: string;
  readAt: string | null;
  createdAt: string;
  data: {
    activityName?: string;
    organisationName?: string;
    path?: string;
    code?: string;
    type?: "fixed" | "percentage";
    value?: number;
    currency?: string | null;
    count?: number;
    from?: string;
    prize?: string;
    rewardName?: string;
    changes?: string[];
    amount?: number;
    tokens?: number;
    deletionDate?: string;
  };
};

const ease = [0.22, 1, 0.36, 1] as const;

async function fetchNotifications(
  token: string,
): Promise<{ notifications: UserNotification[]; unreadCount: number } | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me/notifications`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );
    const body = await response.json();
    return body.status === "success" ? body : null;
  } catch {
    // The bell is optional chrome; a failed fetch just shows no dot.
    return null;
  }
}

/**
 * Explore's bell (Figma "Notification"): unread dot, a panel of cards with a
 * "View" link each, and the empty state. Opening the panel marks everything
 * read; the cards keep their unread tint until it closes.
 */
export default function NotificationBell() {
  const t = useTranslations("Notifications");
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<UserNotification[] | null>(null);
  const [unread, setUnread] = useState(0);

  const load = useCallback(() => {
    if (!token) return;
    fetchNotifications(token).then((body) => {
      if (!body) return;
      setItems(body.notifications);
      setUnread(body.unreadCount);
    });
  }, [token]);

  useEffect(load, [load]);

  // New items arrive while the page is open (a reminder, a refund), so check
  // every minute while the tab is visible, and as soon as it becomes visible.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    const id = setInterval(onVisible, 60_000);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  async function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      load();
      if (unread > 0 && token) {
        setUnread(0);
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/me/notifications/read`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: "{}",
          },
        ).catch(() => {});
      }
    } else {
      // Clear the unread tint once the visitor has seen the cards.
      setItems(
        (current) =>
          current?.map((item) => ({
            ...item,
            readAt: item.readAt ?? new Date().toISOString(),
          })) ?? null,
      );
    }
  }

  if (!token) return null;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        aria-label={t("open")}
        className="relative w-12 h-12 lg:w-14 lg:h-14 shrink-0 flex items-center justify-center bg-neutral-100 rounded-full cursor-pointer transition-transform active:scale-90"
      >
        <motion.span
          animate={
            unread > 0 ? { rotate: [0, -14, 12, -8, 6, 0] } : { rotate: 0 }
          }
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex"
        >
          <Notification size={20} color="#737C8A" variant="Bulk" />
        </motion.span>
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="dot"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="absolute top-[0.6rem] right-[0.6rem] size-[0.9rem] rounded-full bg-primary-500 ring-2 ring-white"
            />
          )}
        </AnimatePresence>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[25rem] lg:w-[32rem] max-w-[calc(100vw-3.2rem)] p-[10px] bg-white border border-neutral-100 rounded-[10px] shadow-[0px_5px_10px_0px_rgba(0,0,0,0.1)]"
      >
        <p className="pt-[5px] pb-[10px] text-[1.4rem] leading-8 font-medium text-deep-100">
          {t("title")}
        </p>
        {items && items.length > 0 ? (
          <ul className="flex flex-col gap-[10px] max-h-[30rem] lg:max-h-[42rem] overflow-y-auto overscroll-contain">
            {items.map((item, i) => (
              <motion.li
                key={item.notificationId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  delay: Math.min(i * 0.04, 0.3),
                  ease,
                }}
              >
                <NotificationCard
                  item={item}
                  onNavigate={() => setOpen(false)}
                />
              </motion.li>
            ))}
          </ul>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease }}
            className="flex flex-col items-center gap-6 py-10 text-center"
          >
            <div className="size-[8rem] rounded-full bg-neutral-100 flex items-center justify-center">
              <div className="size-[6rem] rounded-full bg-neutral-200 flex items-center justify-center">
                <Notification size={30} color="#0D0D0D" variant="Bulk" />
              </div>
            </div>
            <p className="text-[1.4rem] leading-8 font-medium text-deep-100">
              {t("emptyTitle")}
            </p>
            <p className="text-[1.2rem] leading-[1.65rem] text-neutral-600 max-w-[24rem]">
              {t("empty")}
            </p>
          </motion.div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function NotificationCard({
  item,
  onNavigate,
}: {
  item: UserNotification;
  onNavigate: () => void;
}) {
  const t = useTranslations("Notifications");
  const locale = useLocale();
  const { data } = item;
  const Icon = ICONS[item.kind] ?? Notification;
  const somber = SOMBER.has(item.kind);
  // An item from a newer API than this page knows: show nothing rather than a
  // raw message key.
  if (!t.has(`${item.kind}.title`)) return null;
  const value =
    data.type === "percentage"
      ? `${data.value}%`
      : `${data.value ?? ""} ${data.currency ?? ""}`.trim();
  const changes = (data.changes ?? [])
    .map((c) => (t.has(`changes.${c}`) ? t(`changes.${c}`) : c))
    .join(t("changes.and"));
  const amount =
    data.amount && data.amount > 0
      ? `${new Intl.NumberFormat(locale).format(data.amount)}${data.currency ? ` ${data.currency}` : ""}`
      : data.tokens
        ? `${data.tokens} tokens`
        : "";
  const date = data.deletionDate
    ? new Date(data.deletionDate).toLocaleDateString(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div
      className={`flex flex-col gap-[10px] p-[5px] rounded-[7.5px] border-[0.5px] transition-colors duration-500 ${
        item.readAt
          ? "bg-white border-neutral-100"
          : "bg-primary-50/60 border-primary-100"
      }`}
    >
      <div className="flex items-center gap-[5px]">
        <span
          className={`${somber ? "bg-neutral-100" : "bg-primary-100"} rounded-[30px] p-[5px] flex`}
        >
          <Icon
            size={20}
            color={somber ? "#2E3237" : "#E45B00"}
            variant="Bulk"
          />
        </span>
        <span className="text-[1.2rem] leading-[1.65rem] text-deep-100">
          {t(`${item.kind}.title`)}
        </span>
      </div>
      <p className="text-[1.2rem] leading-[1.65rem] text-neutral-600">
        {t(`${item.kind}.body`, {
          activity: data.activityName ?? "",
          organisation: data.organisationName ?? "",
          code: data.code ?? "",
          value,
          count: data.count ?? 1,
          from: data.from ?? "",
          prize: data.prize ?? "",
          reward: data.rewardName ?? "",
          changes,
          amount,
          date,
          tokens: data.tokens ?? 0,
        })}
      </p>
      <div className="flex items-center justify-between gap-4">
        {data.code ? (
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(data.code!).then(
                () => toast.success(t("copied")),
                () => {},
              );
            }}
            className="flex items-center gap-2 px-[8px] py-[2px] rounded-[30px] bg-neutral-100 text-[1.2rem] font-semibold tracking-[0.06em] text-deep-100 cursor-pointer active:scale-95 transition-transform"
            aria-label={t("copy")}
          >
            {data.code}
            <Copy size={12} color="#737C8A" variant="Bulk" />
          </button>
        ) : (
          <span />
        )}
        {data.path && (
          <Link
            href={data.path}
            onClick={onNavigate}
            className="group flex items-center gap-[5px] text-[1.2rem] leading-[1.65rem] text-primary-500"
          >
            {t("view")}
            <RouteSquare
              size={15}
              color="#E45B00"
              variant="Bulk"
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        )}
      </div>
    </div>
  );
}
