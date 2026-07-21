"use client";
import { Link, usePathname } from "@/i18n/navigation";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Edit2, HamburgerMenu, MoreCircle, Trash } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import ComingSoonDrawerContent from "./ComingSoonDrawerContent";
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
import { Event } from "@ticketwaze/typescript-config";
import { RequestEventDeletion } from "@/actions/EventActions";
import { toast } from "sonner";
import { ButtonRed } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { useSession } from "next-auth/react";

/**
 * The teaser's overflow menu, deliberately the same control as the one on a
 * real event page — same trigger, same popover, same rows.
 *
 * Only the contents differ: a teaser has no attendees, no discount codes and no
 * end-of-event report, so what is left is details, edit and delete.
 */
export default function ComingSoonMore({
  event,
  slug,
  deletionStatus,
  onDeletionScheduled,
}: {
  event: Event;
  slug: string;
  deletionStatus: "pending_deletion" | "deleted" | null;
  onDeletionScheduled: (scheduledAt: string, reason: string) => void;
}) {
  const t = useTranslations("Events.coming_soon");
  const tEvent = useTranslations("Events.single_event");
  const closeRef = useRef<HTMLButtonElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState("");
  const locale = useLocale();
  const { data: session } = useSession();
  const pathname = usePathname();

  const isPendingDeletion = deletionStatus === "pending_deletion";
  const isDeleted = deletionStatus === "deleted";

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
            {tEvent("more")}
          </span>
          <div className={"flex flex-col gap-4"}>
            <li>
              <Drawer direction={"right"}>
                <DrawerTrigger className={"w-full"}>
                  <div
                    className={`font-normal cursor-pointer group text-[1.5rem] border-b border-neutral-200 py-4 leading-8 text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
                  >
                    <span>{tEvent("details")}</span>
                    <HamburgerMenu size="20" variant="Bulk" color={"#2E3237"} />
                  </div>
                </DrawerTrigger>
                <ComingSoonDrawerContent event={event} />
              </Drawer>
            </li>
            {!isPendingDeletion && !isDeleted && (
              <li>
                <Link
                  href={`/events/coming-soon/${slug}/edit`}
                  className={`cursor-pointer font-normal group text-[1.5rem] border-b border-neutral-200 py-4 leading-8 text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
                >
                  <span>{t("details.edit")}</span>
                  <Edit2 size="20" variant="Bulk" color={"#2E3237"} />
                </Link>
              </li>
            )}
            {!isPendingDeletion && !isDeleted && (
              <li>
                <Dialog>
                  <DialogTrigger className="w-full">
                    <div
                      className={`font-normal cursor-pointer group text-[1.5rem] border-b border-neutral-200 py-4 leading-8 text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
                    >
                      <span className={"text-failure"}>{tEvent("delete")}</span>
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
                        {tEvent("deletion.schedule_title")}
                      </DialogTitle>
                      <DialogDescription className={"sr-only"}>
                        Delete teaser
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-8">
                      <p className="text-[1.5rem] leading-8 text-neutral-600">
                        {t("deletion.warning")}
                      </p>
                      <div className="flex flex-col gap-2">
                        <label className="text-[1.4rem] font-medium leading-8 text-deep-100">
                          {tEvent("deletion.reason_label")}
                        </label>
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder={tEvent("deletion.reason_placeholder")}
                          rows={4}
                          className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-6 py-4 text-[1.5rem] leading-8 text-deep-100 outline-none focus:border-neutral-400 resize-none"
                        />
                        <span
                          className={`text-[1.2rem] leading-6 text-right ${reason.length < 10 ? "text-failure" : "text-neutral-500"}`}
                        >
                          {reason.length} {tEvent("deletion.chars")}
                        </span>
                      </div>
                      {/* A teaser has no start date to shorten the grace period
                          against, so the API always allows the full three days. */}
                      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                        <span className="text-[1.4rem] leading-7 text-amber-700">
                          {tEvent("deletion.grace_days", { days: 3 })}
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
                          tEvent("deletion.schedule_cta")
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
