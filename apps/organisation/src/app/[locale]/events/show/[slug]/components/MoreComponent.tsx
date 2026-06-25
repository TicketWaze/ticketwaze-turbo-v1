"use client";
import { Link, usePathname } from "@/i18n/navigation";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  HamburgerMenu,
  MoreCircle,
  Profile2User,
  TicketDiscount,
  Trash,
} from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import EventDrawerContent from "./EventDrawerContent";
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
import { useSession } from "next-auth/react";
import { DateTime } from "luxon";

export default function MoreComponent({
  event,
  daysLeft,
  isFree,
  slug,
  membershipTier,
  deletionStatus,
  onDeletionScheduled,
}: {
  event: Event;
  daysLeft: number | null;
  isFree: boolean;
  slug: string;
  membershipTier: MembershipTier;
  deletionStatus: "pending_deletion" | "deleted" | null;
  onDeletionScheduled: (scheduledAt: string, reason: string) => void;
}) {
  const t = useTranslations("Events.single_event");
  const closeRef = useRef<HTMLButtonElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState("");
  const locale = useLocale();
  const { data: session } = useSession();
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
      session?.user.accessToken ?? "",
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

  return (
    <Popover>
      <PopoverTrigger>
        <div
          className={
            "w-14 h-14 cursor-pointer rounded-full bg-neutral-100 flex items-center justify-center"
          }
        >
          <MoreCircle variant={"Bulk"} size={20} color={"#737C8A"} />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className={"w-100 p-0 m-0 bg-none shadow-none border-none mx-4"}
      >
        <ul
          className={
            "bg-neutral-100 border border-neutral-200 right-8 p-4 mb-8 rounded-2xl shadow-xl bottom-full flex flex-col gap-4"
          }
        >
          <span
            className={
              "font-medium py-2 border-b border-neutral-200 text-[1.4rem] text-deep-100 leading-8"
            }
          >
            {t("more")}
          </span>
          <div className={"flex flex-col gap-4"}>
            {event.isPrivate && (
              <li>
                <Link
                  href={`${slug}/attendees`}
                  className={`cursor-pointer font-normal group text-[1.5rem] border-b border-neutral-200 py-4 leading-8 text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full ${isPendingDeletion ? "pointer-events-none opacity-40" : ""}`}
                >
                  <span>{t("attendees.title")}</span>
                  <Profile2User size="20" variant="Bulk" color={"#2E3237"} />
                </Link>
              </li>
            )}
            <li>
              <Drawer direction={"right"}>
                <DrawerTrigger className={"w-full"}>
                  <div
                    className={`font-normal cursor-pointer group text-[1.5rem] border-b border-neutral-200 py-4 leading-8 text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
                  >
                    <span>{t("details")}</span>
                    <HamburgerMenu size="20" variant="Bulk" color={"#2E3237"} />
                  </div>
                </DrawerTrigger>
                <EventDrawerContent event={event} />
              </Drawer>
            </li>
            {membershipTier.membershipName !== "free" &&
              daysLeft !== null &&
              daysLeft > 0 &&
              !isFree &&
              !isPendingDeletion &&
              !isDeleted && (
                <li>
                  <Link
                    href={`${slug}/discount-codes`}
                    className={`cursor-pointer font-normal group text-[1.5rem] border-b border-neutral-200 py-4 leading-8 text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
                  >
                    <span>{t("discount.subtitle")}</span>
                    <TicketDiscount
                      size="20"
                      variant="Bulk"
                      color={"#2E3237"}
                    />
                  </Link>
                </li>
              )}
            {daysLeft !== null && daysLeft > 0 && !isPendingDeletion && !isDeleted && (
              <li>
                <Dialog>
                  <DialogTrigger className="w-full">
                    <div
                      className={`font-normal cursor-pointer group text-[1.5rem] border-b border-neutral-200 py-4 leading-8 text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
                    >
                      <span className={"text-failure"}>{t("delete")}</span>
                      <Trash size="20" variant="Bulk" color={"#DE0028"} />
                    </div>
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
                        {isLoading ? (
                          <LoadingCircleSmall />
                        ) : (
                          t("deletion.schedule_cta")
                        )}
                      </ButtonRed>
                      <DialogClose ref={closeRef} className="sr-only" />
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </li>
            )}
          </div>
        </ul>
      </PopoverContent>
    </Popover>
  );
}
