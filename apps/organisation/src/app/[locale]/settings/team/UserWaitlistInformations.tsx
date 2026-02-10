"use client";
import FormatDate from "@/lib/FormatDate";
import GetRoleName from "@/lib/GetRoleName";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { useTranslations } from "next-intl";
import RemoveInvitationDrawerContent from "./RemoveInvitationDialogContent";
import { WaitlistMember } from "@ticketwaze/typescript-config";
import Separator from "@/components/shared/Separator";
export default function UserWaitlistInformation({
  member,
  authorized,
}: {
  member: WaitlistMember;
  authorized: boolean;
}) {
  const t = useTranslations("Settings.team");
  return (
    <DrawerContent
      className={"w-xl lg:w-208 bg-white my-6 p-12 rounded-[30px]"}
    >
      <div className={"w-full flex flex-col items-center overflow-y-scroll"}>
        <DrawerTitle className={"pb-16"}>
          <span
            className={
              "font-primary font-medium text-center text-[2.6rem] leading-12 text-black"
            }
          >
            {member.fullName}
          </span>
        </DrawerTitle>
        <DrawerDescription className={"w-full"}>
          <span className={"w-full flex flex-col gap-8"}>
            <span
              className={
                "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
              }
            >
              {t("table.name")}
              <span className={"text-deep-100 font-medium leading-8"}>
                {member.fullName}
              </span>
            </span>
            <span
              className={
                "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
              }
            >
              {t("table.email")}
              <span className={"text-deep-100 font-medium leading-8"}>
                {member.email}
              </span>
            </span>
            <span
              className={
                "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
              }
            >
              {t("table.role")}
              <span className={"text-deep-100 font-medium leading-8"}>
                {GetRoleName(member.role)}
              </span>
            </span>
          </span>
          <Separator />
          <span className={"w-full flex flex-col gap-8"}>
            <span
              className={
                "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
              }
            >
              {t("added_by")}
              <span className={"text-deep-100 font-medium leading-8"}>
                {member.addedBy}
              </span>
            </span>
            <span
              className={
                "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
              }
            >
              {t("joined_at")}
              <span className={"text-deep-100 font-medium leading-8"}>
                {FormatDate(member.createdAt)}
              </span>
            </span>
            <span
              className={
                "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
              }
            >
              {t("table.status")}
              <span
                className={
                  "py-[.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase text-[#EA961C]  px-2 rounded-[30px] bg-[#f5f5f5]"
                }
              >
                {t("invited")}
              </span>
            </span>
          </span>
        </DrawerDescription>
      </div>

      {authorized && (
        <DrawerFooter>
          <div className={"flex gap-8 w-full items-center"}>
            <Dialog>
              <DialogTrigger className={"w-full flex-1"}>
                <span
                  className={
                    "w-full border-failure text-failure bg-[#FCE5EA] px-4 py-6 border-2 rounded-[100px] text-center font-medium text-[1.5rem] h-auto leading-8 cursor-pointer transition-all duration-400 flex items-center justify-center"
                  }
                >
                  {t("remove_invitation")}
                </span>
              </DialogTrigger>
              <RemoveInvitationDrawerContent email={member.email} />
            </Dialog>
          </div>
        </DrawerFooter>
      )}
    </DrawerContent>
  );
}
