"use client";
import { useTranslations } from "next-intl";
import noauth from "./noauth.svg";
import Image from "next/image";
import { LinkPrimary } from "../shared/Links";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export default function NoAuthDialog() {
  const t = useTranslations("Layout.noAuth");
  return (
    <DialogContent className={"w-[360px] lg:w-[520px] "}>
      <DialogHeader>
        <DialogTitle
          className={
            "font-medium hidden border-b border-neutral-100 pb-[2rem]  text-[2.6rem] leading-[30px] text-black font-primary"
          }
        >
          {t("title")}
        </DialogTitle>
        <DialogDescription className={"sr-only"}>
          <span>Share event</span>
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col items-center justify-center gap-[40px]">
        <Image src={noauth} width={150} height={150} alt="no auth image" />
        <div
          className={
            "flex flex-col w-auto justify-center items-center gap-[15px]"
          }
        >
          <span className="font-medium text-[2.6rem] leading-12 text-black">
            {t("title")}
          </span>
          <p
            className={
              "font-sans text-[1.8rem] leading-[25px] text-[#cdcdcd] text-center w-[320px] lg:w-full"
            }
          >
            {t("description")}
          </p>
        </div>
      </div>
      <DialogFooter className="pt-8">
        <DialogClose className="w-full">
          <span className="bg-primary-50 border-primary-500 hover:border-primary-200  text-primary-500 px-[3rem] py-[15px] border-2 rounded-[100px] text-center font-medium text-[1.5rem] h-auto leading-[20px] cursor-pointer transition-all duration-400 flex items-center justify-center">
            {t("cancel")}
          </span>
        </DialogClose>
        <LinkPrimary className="w-full" href="/auth/login">
          {t("proceed")}
        </LinkPrimary>
      </DialogFooter>
    </DialogContent>
  );
}
