"use client";
import { Link, usePathname } from "@/i18n/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ClipboardText,
  DocumentDownload,
  Gift,
  HamburgerMenu,
  MoreCircle,
  Profile2User,
  TicketDiscount,
  Trash,
} from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Event, MembershipTier } from "@ticketwaze/typescript-config";
import { RequestEventDeletion } from "@/actions/EventActions";
import { toast } from "sonner";
import { ButtonRed } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";

const itemClass =
  "w-full flex items-center justify-between gap-6 py-4 border-b border-neutral-200 font-sans text-[1.5rem] leading-8 text-neutral-700 cursor-pointer transition-colors hover:text-primary-500";

/**
 * The header's ⋯ menu (Figma 1651:57344): "Add discount code", "Event
 * details" and "Export" first, as designed, then the post-design entries
 * (attendees of a private activity, checkout questions, rewards) and Delete.
 */
export default function MoreComponent({
  event,
  daysLeft,
  isFree,
  slug,
  membershipTier,
  deletionStatus,
  onDeletionScheduled,
  onShowDetails,
  onExport,
  onAddDiscount,
}: {
  event: Event;
  daysLeft: number | null;
  isFree: boolean;
  slug: string;
  membershipTier: MembershipTier;
  deletionStatus: "pending_deletion" | "deleted" | null;
  onDeletionScheduled: (scheduledAt: string, reason: string) => void;
  onShowDetails: () => void;
  onExport: () => void;
  /** Opens the Add Discount Code panel on the event page. */
  onAddDiscount: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations("Events.single_event");
  const tRewards = useTranslations("Events.single_event.rewards");
  const closeRef = useRef<HTMLButtonElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState("");
  const locale = useLocale();
  const pathname = usePathname();

  const isPendingDeletion = deletionStatus === "pending_deletion";
  const isDeleted = deletionStatus === "deleted";

  // Grace period: min(3, ceil(daysLeft)), shown before the API confirms
  const graceDays =
    daysLeft !== null && daysLeft > 0 ? Math.min(3, Math.ceil(daysLeft)) : 0;

  async function scheduleDeletion() {
    setIsLoading(true);
    const result = await RequestEventDeletion(
      event.eventId,
      locale,
      reason,
      pathname,
    );
    setIsLoading(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    closeRef.current?.click();
    onDeletionScheduled(result.scheduledDeletionAt, reason);
  }

  const canDiscount =
    membershipTier.membershipName !== "free" &&
    daysLeft !== null &&
    daysLeft > 0 &&
    !isFree &&
    !isPendingDeletion &&
    !isDeleted;
  const canReward =
    daysLeft !== null &&
    daysLeft > 0 &&
    !isFree &&
    !isPendingDeletion &&
    !isDeleted;
  const canDelete =
    daysLeft !== null && daysLeft > 0 && !isPendingDeletion && !isDeleted;

  /* Each entry, in menu order; falsy entries are skipped. */
  const items: React.ReactNode[] = [
    canDiscount && (
      <button
        key="discount"
        type="button"
        className={cn(itemClass, "text-primary-500")}
        onClick={() => {
          setMenuOpen(false);
          onAddDiscount();
        }}
      >
        <span>{t("add_discount")}</span>
        <TicketDiscount size="20" variant="Bulk" color={"#E45B00"} />
      </button>
    ),
    <button
      key="details"
      type="button"
      className={itemClass}
      onClick={() => {
        setMenuOpen(false);
        onShowDetails();
      }}
    >
      <span>{t("event_details")}</span>
      <HamburgerMenu size="20" variant="Bulk" color={"#2E3237"} />
    </button>,
    !isDeleted && (
      <button
        key="export"
        type="button"
        className={itemClass}
        onClick={() => {
          setMenuOpen(false);
          onExport();
        }}
      >
        <span>{t("export")}</span>
        <DocumentDownload size="20" variant="Bulk" color={"#2E3237"} />
      </button>
    ),
    // The codes already made (post-design list), once there are any to see.
    membershipTier.membershipName !== "free" &&
      !isDeleted &&
      (canDiscount || (event.discountCodes?.length ?? 0) > 0) && (
        <Link
          key="discount-codes"
          href={`${slug}/discount-codes`}
          className={itemClass}
        >
          <span>{t("discount.manage")}</span>
          <TicketDiscount size="20" variant="Bulk" color={"#2E3237"} />
        </Link>
      ),
    event.isPrivate && (
      <Link
        key="attendees"
        href={`${slug}/attendees`}
        className={cn(
          itemClass,
          isPendingDeletion && "pointer-events-none opacity-40",
        )}
      >
        <span>{t("attendees.title")}</span>
        <Profile2User size="20" variant="Bulk" color={"#2E3237"} />
      </Link>
    ),
    /*
      Gated on the tier's own flag rather than its NAME, so this entry and the
      API agree by construction — the API asks
      `SubscriptionHelper.can(org, 'checkoutForms')`, and this is the same
      column. `membershipTier` counts trials on both sides, which is
      deliberate: a trial is meant to showcase exactly this.
    */
    membershipTier.checkoutForms && !isPendingDeletion && !isDeleted && (
      <Link key="forms" href={`${slug}/forms`} className={itemClass}>
        <span>{t("forms.title")}</span>
        <ClipboardText size="20" variant="Bulk" color={"#2E3237"} />
      </Link>
    ),
    /*
      REWARDS, ON EVERY PLAN INCLUDING FREE. Unlike a discount code, this costs
      Ticketwaze nothing — it is the organiser's own gift to their buyers — so
      there is nothing to gate on a membership tier. Paid activities only: a
      reward is earned by buying.
    */
    canReward && (
      <Link key="rewards" href={`${slug}/rewards`} className={itemClass}>
        <span>{tRewards("title")}</span>
        <Gift size="20" variant="Bulk" color={"#2E3237"} />
      </Link>
    ),
    canDelete && (
      <Dialog key="delete">
        <DialogTrigger
          className={cn(
            itemClass,
            "border-b-0 text-failure hover:text-failure/80",
          )}
        >
          <span>{t("delete")}</span>
          <Trash size="20" variant="Bulk" color={"#DE0028"} />
        </DialogTrigger>
        <DialogContent className={"w-xl lg:w-208"}>
          <DialogHeader>
            <DialogTitle
              className={
                "font-medium border-b border-neutral-100 pb-8 text-[2.6rem] leading-12 text-black font-primary"
              }
            >
              {t("deletion.schedule_title")}
            </DialogTitle>
            <DialogDescription className={"sr-only"}>
              Delete activity
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-8">
            <p className="text-[1.5rem] leading-8 text-neutral-600">
              {t("deletion.warning")}
            </p>
            <div className="flex flex-col gap-2">
              <label className="text-[1.4rem] font-medium leading-8 text-deep-100">
                {t("deletion.reason_label")}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("deletion.reason_placeholder")}
                rows={4}
                className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-6 py-4 text-[1.5rem] leading-8 text-deep-100 outline-none focus:border-neutral-400 resize-none"
              />
              <span
                className={`text-[1.2rem] leading-6 text-right ${reason.length < 10 ? "text-failure" : "text-neutral-500"}`}
              >
                {reason.length} {t("deletion.chars")}
              </span>
            </div>
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <span className="text-[1.4rem] leading-7 text-amber-700">
                {graceDays > 0
                  ? t("deletion.grace_days", { days: graceDays })
                  : t("deletion.grace_immediate")}
              </span>
            </div>
          </div>
          <DialogFooter>
            <ButtonRed
              onClick={scheduleDeletion}
              disabled={isLoading || reason.trim().length < 10}
              className="w-full"
            >
              {isLoading ? <LoadingCircleSmall /> : t("deletion.schedule_cta")}
            </ButtonRed>
            <DialogClose ref={closeRef} className="sr-only" />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ),
  ].filter(Boolean);

  return (
    <Popover open={menuOpen} onOpenChange={setMenuOpen}>
      <PopoverTrigger
        aria-label={t("more")}
        className="w-[3.5rem] h-[3.5rem] shrink-0 cursor-pointer rounded-full bg-neutral-100 flex items-center justify-center transition-colors hover:bg-neutral-200 data-[state=open]:bg-neutral-200"
      >
        <MoreCircle variant={"Bulk"} size={20} color={"#737C8A"} aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[23.5rem] p-[1rem] bg-neutral-100 border border-neutral-200 rounded-[1rem] shadow-[0px_10px_30px_rgba(0,0,0,0.12)]"
      >
        <p className="font-sans font-medium pb-2 border-b border-neutral-200 text-[1.4rem] text-deep-100 leading-8">
          {t("more")}
        </p>
        <ul className="flex flex-col [&>li:last-child>*]:border-b-0">
          {items.map((item, i) => (
            <motion.li
              key={(item as React.ReactElement).key ?? i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
            >
              {item}
            </motion.li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
