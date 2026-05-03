"use client";
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useTranslations } from "next-intl";
import Separator from "@/components/shared/Separator";
import { ButtonAccent, ButtonPrimary } from "@/components/shared/buttons";

export default function RequestDetails({}) {
  const t = useTranslations("Payouts.request_details");
  return (
    <DrawerContent className={"my-8 p-12 rounded-[30px] w-full"}>
      <div className={"w-full flex flex-col items-center overflow-y-scroll"}>
        <DrawerTitle className={"pb-16"}>
          <span
            className={
              "font-primary font-medium text-center text-[2.6rem] leading-12 text-black"
            }
          >
            {t("title")}
          </span>
        </DrawerTitle>
        <DrawerDescription asChild className="w-full">
          <div>
            <div className={"w-full flex flex-col gap-8 pb-6"}>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("amount")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  3000 HTG
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("request_date")}{" "}
                <span className={"text-deep-100 font-medium leading-8"}>
                  Jan 16, 2025 12:21 PM
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("requested_by")}{" "}
                <span className={"text-deep-100 font-medium leading-8"}>
                  Edshy
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("request_status")}{" "}
                <span className={"text-deep-100 font-medium leading-8"}>
                  <span
                    className={`py-[0.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase  text-[#EA961C] px-2 rounded-[30px] bg-neutral-200`}
                  >
                    Pending
                  </span>
                </span>
              </p>
            </div>
            <Separator />
            <div className={"w-full flex flex-col gap-8 py-6"}>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("bank_name")}{" "}
                <span className={"text-deep-100 font-medium leading-8"}>
                  Sogebank
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("account")}{" "}
                <span className={"text-deep-100 font-medium leading-8"}>
                  0123456789
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("processed_date")}{" "}
                <span className={"text-deep-100 font-medium leading-8"}>
                  Jan 16, 2025 12:21 PM
                </span>
              </p>
            </div>
          </div>
        </DrawerDescription>
      </div>

      <DrawerFooter>
        <div className={"flex gap-8"}>
          <DrawerClose asChild className={"flex-1 cursor-pointer"}>
            <ButtonAccent className={"w-full"}>{t("close")}</ButtonAccent>
          </DrawerClose>
          <ButtonPrimary className={"flex-1"}>{t("approve")}</ButtonPrimary>
        </div>
      </DrawerFooter>
    </DrawerContent>
  );
}
