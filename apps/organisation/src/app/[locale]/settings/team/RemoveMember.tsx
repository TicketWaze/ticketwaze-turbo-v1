"use client";
import { RemoveMemberQuery } from "@/actions/organisationActions";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function RemoveMember({ email }: { email: string }) {
  const t = useTranslations("Settings.team");
  const { data: session } = useSession();
  const organisation = session?.activeOrganisation;
  const locale = useLocale();
  const CloseDialogRef = useRef<HTMLSpanElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  async function removeMember() {
    setIsLoading(true);
    if (session?.user.userId === organisation?.userId) {
      toast.warning(t("noSelfDelete"));
      setIsLoading(false);
      CloseDialogRef.current?.click();
      return;
    }
    const result = await RemoveMemberQuery(
      organisation?.organisationId ?? "",
      session?.user.accessToken ?? "",
      email,
      locale,
    );
    if (result.status === "success") {
      toast.success("Member Revoked");
    } else {
      toast.error(result.error);
    }
    setIsLoading(false);
    CloseDialogRef.current?.click();
  }
  return (
    <DialogContent className={"w-xl lg:w-208 "}>
      <DialogHeader>
        <DialogTitle
          className={
            "font-medium border-b border-neutral-100 pb-8  text-[2.6rem] leading-12 text-black font-primary"
          }
        >
          {t("remove")}
        </DialogTitle>
        <DialogDescription className={"sr-only"}>
          <span>Remove Member</span>
        </DialogDescription>
      </DialogHeader>
      <div
        className={
          "flex flex-col w-auto justify-center items-center pt-10 gap-12"
        }
      >
        <p className={"text-[1.8rem] text-center leading-10 text-gray-400"}>
          {t("confirm_text")}
        </p>
      </div>

      <DialogFooter>
        <span
          onClick={removeMember}
          className={
            "border-failure text-failure bg-[#FCE5EA] px-12 py-10 border-2 rounded-[100px] text-center  font-medium text-[1.5rem] h-auto leading-8 cursor-pointer transition-all duration-400 flex items-center justify-center w-full mt-12"
          }
        >
          {isLoading ? <LoadingCircleSmall /> : t("confirm")}
        </span>
        <DialogClose className="w-full sr-only ">
          <span ref={CloseDialogRef}>close</span>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}
