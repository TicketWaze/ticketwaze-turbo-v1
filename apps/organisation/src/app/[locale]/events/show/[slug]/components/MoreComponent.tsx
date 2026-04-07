"use client";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
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
import { Event } from "@ticketwaze/typescript-config";
import { DeleteEvent } from "@/actions/EventActions";
import { toast } from "sonner";
import PageLoader from "@/components/PageLoader";
import { ButtonRed } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Input } from "@/components/shared/Inputs";
import { useSession } from "next-auth/react";
export default function MoreComponent({
  event,
  daysLeft,
  isFree,
  slug,
}: {
  event: Event;
  daysLeft: number | null;
  isFree: boolean;
  slug: string;
}) {
  const t = useTranslations("Events.single_event");
  const closeRef = useRef<HTMLButtonElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [eventName, setEventName] = useState<string>();
  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  async function deleteEvent() {
    setIsLoading(true);
    const result = await DeleteEvent(
      event.eventId,
      session?.user.accessToken ?? "",
      pathname,
      locale,
    );
    if (result.status !== "success") {
      toast.error(result.error);
    } else {
      router.push("/events");
    }
    setIsLoading(false);
  }
  return (
    <>
      <PageLoader isLoading={isLoading} />
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
              "bg-neutral-100 border border-neutral-200 right-8 p-4  mb-8 rounded-2xl shadow-xl bottom-full flex flex-col gap-4"
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
              {event.eventType === "private" && (
                <li>
                  <Link
                    href={`${slug}/attendees`}
                    className={`cursor-pointer font-normal group text-[1.5rem] border-b border-neutral-200 py-4 leading-8 text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
                  >
                    <span>{t("attendees.title")}</span>
                    <Profile2User size="20" variant="Bulk" color={"#2E3237"} />
                  </Link>
                </li>
              )}
              <li className={""}>
                <Drawer direction={"right"}>
                  <DrawerTrigger className={"w-full"}>
                    <div
                      className={`font-normal cursor-pointer group text-[1.5rem] border-b border-neutral-200 py-4 leading-8 text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
                    >
                      <span className={""}>{t("details")}</span>
                      <HamburgerMenu
                        size="20"
                        variant="Bulk"
                        color={"#2E3237"}
                      />
                    </div>
                  </DrawerTrigger>
                  <EventDrawerContent event={event} />
                </Drawer>
              </li>
              {session?.activeOrganisation.membershipTier.membershipName !==
                "free" &&
                daysLeft !== null &&
                daysLeft > 0 &&
                !isFree && (
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
                  <DialogContent className={"w-xl lg:w-208 "}>
                    <DialogHeader>
                      <DialogTitle
                        className={
                          "font-medium border-b border-neutral-100 pb-8  text-[2.6rem] leading-12 text-black font-primary"
                        }
                      >
                        {t("delete")}
                      </DialogTitle>
                      <DialogDescription className={"sr-only"}>
                        <span>Share event</span>
                      </DialogDescription>
                    </DialogHeader>
                    <div
                      className={
                        "flex flex-col w-auto justify-center items-center gap-12"
                      }
                    >
                      <p
                        className={
                          "font-sans text-[1.8rem] leading-10 text-[#cdcdcd] text-center w-[320px] lg:w-full"
                        }
                      >
                        {t("deleteWarning")}
                      </p>
                      <div className="w-full">
                        <Input
                          autoFocus={false}
                          onChange={(e) => setEventName(e.target.value)}
                          value={eventName}
                        >
                          {t("type")}
                        </Input>
                      </div>
                    </div>
                    <DialogFooter>
                      <ButtonRed
                        onClick={deleteEvent}
                        disabled={isLoading || eventName !== event.eventName}
                        className="w-full"
                      >
                        {isLoading ? <LoadingCircleSmall /> : t("delete")}
                      </ButtonRed>
                      <DialogClose
                        ref={closeRef}
                        className="sr-only"
                      ></DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </li>
            </div>
          </ul>
        </PopoverContent>
      </Popover>
    </>
  );
}
