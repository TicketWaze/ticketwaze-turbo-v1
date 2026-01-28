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
import { useForm } from "react-hook-form";
import { Event, User } from "@ticketwaze/typescript-config";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { DeleteEvent, UpdateCheckersListAction } from "@/actions/EventActions";
import { toast } from "sonner";
import PageLoader from "@/components/PageLoader";
import { ButtonRed } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Input } from "@/components/shared/Inputs";
export default function MoreComponent({
  event,
  daysLeft,
  isFree,
  slug,
  authorized,
  eventCheckers,
  organisationCheckers,
  user,
}: {
  event: Event;
  daysLeft: number | null;
  isFree: boolean;
  slug: string;
  authorized: boolean;
  eventCheckers: any;
  organisationCheckers: any;
  user: User;
}) {
  const t = useTranslations("Events.single_event");
  const closeRef = useRef<HTMLButtonElement>(null);
  const addCheckersSchema = z.object({
    eventCheckers: z
      .array(
        z.object({
          userId: z.string(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
        }),
        {
          error: (issue) =>
            issue.input === undefined
              ? "Select at least one Checker"
              : "Select at least one Checker",
        },
      )
      .min(1, "Select at least one Checker"),
  });
  type TaddCheckersSchema = z.infer<typeof addCheckersSchema>;
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaddCheckersSchema>({
    resolver: zodResolver(addCheckersSchema),
    defaultValues: eventCheckers,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [eventName, setEventName] = useState<string>();
  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();
  async function UpdateCheckers(data: TaddCheckersSchema) {
    const result = await UpdateCheckersListAction(
      event.eventId,
      user.accessToken,
      pathname,
      data,
      locale,
    );
    if (result.status !== "success") {
      toast.error(result.error);
    }
    closeRef.current?.click();
  }
  async function deleteEvent() {
    setIsLoading(true);
    const result = await DeleteEvent(
      event.eventId,
      user.accessToken,
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
              "w-[35px] h-[35px] cursor-pointer rounded-full bg-neutral-100 flex items-center justify-center"
            }
          >
            <MoreCircle variant={"Bulk"} size={20} color={"#737C8A"} />
          </div>
        </PopoverTrigger>
        <PopoverContent
          className={"w-[250px] p-0 m-0 bg-none shadow-none border-none mx-4"}
        >
          <ul
            className={
              "bg-neutral-100 border border-neutral-200 right-8 p-4  mb-8 rounded-[1rem] shadow-xl bottom-full flex flex-col gap-4"
            }
          >
            <span
              className={
                "font-medium py-[5px] border-b-[1px] border-neutral-200 text-[1.4rem] text-deep-100 leading-[20px]"
              }
            >
              {t("more")}
            </span>
            <div className={"flex flex-col gap-4"}>
              {event.eventType === "private" && (
                <li>
                  <Link
                    href={`${slug}/attendees`}
                    className={`cursor-pointer font-normal group text-[1.5rem] border-b-[1px] border-neutral-200 py-4 leading-[20px] text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
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
                      className={`font-normal cursor-pointer group text-[1.5rem] border-b-[1px] border-neutral-200 py-4 leading-[20px] text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
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
              {daysLeft !== null && daysLeft > 0 && !isFree && (
                <li>
                  <Link
                    href={`${slug}/discount-codes`}
                    className={`cursor-pointer font-normal group text-[1.5rem] border-b-[1px] border-neutral-200 py-4 leading-[20px] text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
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
              {/* {event.eventType !== "meet" && authorized && (
                <li>
                  <Dialog>
                    <DialogTrigger className="w-full">
                      <div
                        className={`font-normal cursor-pointer group text-[1.5rem] border-b-[1px] border-neutral-200 py-4 leading-[20px] text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
                      >
                        <span className={""}>{t("checkers")}</span>
                        <SecurityUser
                          size="20"
                          variant="Bulk"
                          color={"#2E3237"}
                        />
                      </div>
                    </DialogTrigger>
                    <DialogContent className={"w-[360px] lg:w-[520px] "}>
                      <DialogHeader>
                        <DialogTitle
                          className={
                            "font-medium border-b border-neutral-100 pb-[2rem]  text-[2.6rem] leading-[30px] text-black font-primary"
                          }
                        >
                          {t("checkers")}
                        </DialogTitle>
                        <DialogDescription className={"sr-only"}>
                          <span>Share event</span>
                        </DialogDescription>
                      </DialogHeader>
                      <div
                        className={
                          "flex flex-col w-auto justify-center items-center gap-[30px]"
                        }
                      >
                        <p
                          className={
                            "font-sans text-[1.8rem] leading-[25px] text-[#cdcdcd] text-center w-[320px] lg:w-full"
                          }
                        >
                          {t("checkers_description")}
                        </p>
                        <div className="w-full">
                          <Controller
                            control={control}
                            name="eventCheckers"
                            defaultValue={eventCheckers}
                            render={({ field }) => (
                              <Select
                                {...field}
                                isMulti
                                options={organisationCheckers}
                                placeholder={t("select_checkers")}
                                styles={{
                                  control: () => ({
                                    borderColor: "transparent",
                                    display: "flex",
                                  }),
                                }}
                                getOptionLabel={(option) =>
                                  `${option.firstName} ${option.lastName}`
                                }
                                getOptionValue={(option) => option.userId}
                                className={
                                  "bg-neutral-100 w-full rounded-[5rem] p-4 text-[1.5rem] leading-[20px] placeholder:text-neutral-600 text-deep-200 outline-none border disabled:text-neutral-600 disabled:cursor-not-allowed border-transparent focus:border-primary-500"
                                }
                              />
                            )}
                          />
                          <span
                            className={"text-[1.2rem] px-8 py-2 text-failure"}
                          >
                            {errors.eventCheckers?.message}
                          </span>
                        </div>
                      </div>
                      <DialogFooter>
                        <ButtonPrimary
                          onClick={handleSubmit(UpdateCheckers)}
                          disabled={isSubmitting}
                          className="w-full"
                        >
                          {isSubmitting ? (
                            <LoadingCircleSmall />
                          ) : (
                            t("update_checker")
                          )}
                        </ButtonPrimary>
                        <DialogClose
                          ref={closeRef}
                          className="sr-only"
                        ></DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </li>
              )} */}
              <li>
                <Dialog>
                  <DialogTrigger className="w-full">
                    <div
                      className={`font-normal cursor-pointer group text-[1.5rem] border-b-[1px] border-neutral-200 py-4 leading-[20px] text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
                    >
                      <span className={"text-failure"}>{t("delete")}</span>
                      <Trash size="20" variant="Bulk" color={"#DE0028"} />
                    </div>
                  </DialogTrigger>
                  <DialogContent className={"w-[360px] lg:w-[520px] "}>
                    <DialogHeader>
                      <DialogTitle
                        className={
                          "font-medium border-b border-neutral-100 pb-[2rem]  text-[2.6rem] leading-[30px] text-black font-primary"
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
                        "flex flex-col w-auto justify-center items-center gap-[30px]"
                      }
                    >
                      <p
                        className={
                          "font-sans text-[1.8rem] leading-[25px] text-[#cdcdcd] text-center w-[320px] lg:w-full"
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
                        disabled={isSubmitting || eventName !== event.eventName}
                        className="w-full"
                      >
                        {isSubmitting ? <LoadingCircleSmall /> : t("delete")}
                      </ButtonRed>
                      <DialogClose
                        ref={closeRef}
                        className="sr-only"
                      ></DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </li>

              {/*<li className={''}>*/}
              {/*  <button*/}
              {/*    className={`font-normal group text-[1.5rem] py-4 leading-[20px] text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}*/}
              {/*  >*/}
              {/*    <span className={''}>{single_event.export}</span>*/}
              {/*    <DocumentDownload size="20" variant="Bulk" color={'#2E3237'} />*/}
              {/*  </button>*/}
              {/*</li>*/}
            </div>
          </ul>
        </PopoverContent>
      </Popover>
    </>
  );
}
