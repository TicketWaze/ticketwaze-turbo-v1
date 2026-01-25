"use client";
import { AddAttendee, RemoveAttendeeAccess } from "@/actions/EventActions";
import TruncateUrl from "@/lib/TruncateUrl";
import { zodResolver } from "@hookform/resolvers/zod";
import { Event } from "@ticketwaze/typescript-config";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CloseCircle, MoreCircle } from "iconsax-reactjs";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import PageLoader from "@/components/PageLoader";
import TopBar from "@/components/shared/TopBar";
import { ButtonPrimary } from "@/components/shared/buttons";
import { Input } from "@/components/shared/Inputs";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";

export default function AttendeesPageContent({ event }: { event: Event }) {
  const t = useTranslations("Events.single_event.attendees");
  const { data: session } = useSession();
  const pathname = usePathname();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  async function RemoveAccess(eventAttendeeId: string) {
    setIsLoading(true);
    const result = await RemoveAttendeeAccess(
      event.eventId,
      eventAttendeeId,
      session?.user.accessToken!,
      pathname,
      locale,
    );
    if (result.status === "success") {
      toast.success("success");
    }
    if (result.error) {
      toast.error(result.error);
    }
    setIsLoading(false);
  }
  return (
    <div className="flex flex-col gap-8">
      <PageLoader isLoading={isLoading} />
      <TopBar title={t("title")}>
        <Drawer direction={"right"}>
          <DrawerTrigger asChild className={"w-full hidden lg:flex"}>
            <ButtonPrimary>{t("subtitle")}</ButtonPrimary>
          </DrawerTrigger>
          <AttenteeDrawerContent event={event} />
        </Drawer>
      </TopBar>
      <Drawer direction={"right"}>
        <DrawerTrigger
          asChild
          className={"lg:hidden absolute bottom-40 right-8"}
        >
          <ButtonPrimary>{t("subtitle")}</ButtonPrimary>
        </DrawerTrigger>
        <AttenteeDrawerContent event={event} />
      </Drawer>
      <Table className={"mt-4"}>
        <TableHeader>
          <TableRow>
            <TableHead
              className={
                "font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
              }
            >
              {t("fullName")}
            </TableHead>
            <TableHead
              className={
                "font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
              }
            >
              {t("email")}
            </TableHead>
            <TableHead
              className={
                "font-bold  text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
              }
            >
              {/*{single_event.table.date_purchased}*/}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {event.eventAttendees.map((attendee) => {
            //   const expires = new Date(expiresAt);
            return (
              <TableRow key={attendee.eventAttendeeId}>
                <TableCell
                  className={
                    "text-[1.5rem] py-[15px] leading-8 text-neutral-900"
                  }
                >
                  <span className="lg:hidden">
                    {TruncateUrl(attendee.fullName, 13)}
                  </span>
                  <span className="hidden lg:inline">{attendee.fullName}</span>
                </TableCell>
                <TableCell
                  className={"text-[1.5rem]  leading-8 text-neutral-900"}
                >
                  <span className="lg:hidden">
                    {TruncateUrl(attendee.email, 10)}
                  </span>
                  <span className="hidden lg:inline">{attendee.email}</span>
                </TableCell>
                <TableCell
                  className={"text-[1.5rem] leading-8 text-neutral-900"}
                >
                  <Popover>
                    <PopoverTrigger>
                      <div
                        className={
                          "w-[35px] h-[35px] cursor-pointer rounded-full bg-neutral-100 flex items-center justify-center"
                        }
                      >
                        <MoreCircle
                          variant={"Bulk"}
                          size={20}
                          color={"#737C8A"}
                        />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent
                      className={
                        "w-[250px] p-0 m-0 bg-none shadow-none border-none mx-4"
                      }
                    >
                      <div
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
                          <button
                            disabled={isLoading}
                            onClick={() =>
                              RemoveAccess(attendee.eventAttendeeId)
                            }
                            className={`font-normal cursor-pointer group text-[1.5rem] py-4 leading-[20px] text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
                          >
                            <span className={"text-failure"}>
                              {t("remove")}
                            </span>
                            <CloseCircle
                              size="20"
                              variant="Bulk"
                              color={"#DE0028"}
                            />
                          </button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function AttenteeDrawerContent({ event }: { event: Event }) {
  const t = useTranslations("Events.single_event.attendees");
  const locale = useLocale();
  const { data: session } = useSession();
  const pathname = usePathname();

  const AddAttendeeSchema = z.object({
    fullName: z.string().min(3),
    email: z.email(),
  });
  type TAddAttendeeSchema = z.infer<typeof AddAttendeeSchema>;

  const {
    register,
    handleSubmit,
    reset,
    resetField,
    formState: { isSubmitting, errors },
  } = useForm<TAddAttendeeSchema>({
    resolver: zodResolver(AddAttendeeSchema),
  });

  async function submitHandler(data: TAddAttendeeSchema) {
    const result = await AddAttendee(
      event.eventId,
      session?.user.accessToken ?? "",
      { ...data },
      pathname,
      locale,
    );
    if (result.status === "success") {
      toast.success("success");
      resetField("email");
      resetField("fullName");
    }
    if (result.error) {
      toast.error(result.error);
    }
  }
  return (
    <DrawerContent
      className={"my-6 bg-white p-[30px] rounded-[30px] lg:w-[580px]"}
    >
      <div className={"w-full flex flex-col items-center overflow-y-scroll"}>
        <DrawerTitle className={"pb-[40px]"}>
          <span
            className={
              "font-primary font-medium text-center text-[2.6rem] leading-[30px] text-black"
            }
          >
            {t("subtitle")}
          </span>
        </DrawerTitle>
        <DrawerDescription className="sr-only">Attendees</DrawerDescription>
        <div className={"w-full flex flex-col gap-6"}>
          <Input
            {...register("fullName")}
            disabled={isSubmitting}
            error={errors.fullName?.message}
          >
            {t("fullName")}
          </Input>
          <Input
            {...register("email")}
            disabled={isSubmitting}
            error={errors.email?.message}
          >
            {t("email")}
          </Input>
        </div>
      </div>

      <DrawerFooter>
        <div className={"flex gap-8"}>
          <DrawerClose className={"flex-1 cursor-pointer"}>
            <div
              className={
                "w-full border-primary-500 text-primary-500 bg-primary-100 px-[3rem] py-[15px] border-2 rounded-[100px] text-center font-medium text-[1.5rem] h-auto leading-[20px] cursor-pointer transition-all duration-400 flex items-center justify-center"
              }
            >
              {t("close")}
            </div>
          </DrawerClose>
          <ButtonPrimary
            onClick={handleSubmit(submitHandler)}
            className={"flex-1"}
          >
            {isSubmitting ? <LoadingCircleSmall /> : t("add")}
          </ButtonPrimary>
        </div>
      </DrawerFooter>
    </DrawerContent>
  );
}
