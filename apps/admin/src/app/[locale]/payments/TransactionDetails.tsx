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
import { ButtonAccent} from "@/components/shared/buttons";

export default function TransactionDetails({}) {
  const t = useTranslations("Payments.transaction_details");
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
                {t("attendee")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  Jean Baptiste
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("email")}{" "}
                <span className={"text-deep-100 font-medium leading-8"}>
                  jean@gmail.com
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
                {t("activity")}{" "}
                <span className={"text-deep-100 font-medium leading-8"}>
                  Cap-Haïtien Jazz Festival
                </span>
              </p>
              <ul className="flex flex-col gap-6 w-full">
                <li>
                  <p
                    className={
                      "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                    }
                  >
                    {t("date")}{" "}
                    <span className={"text-deep-100 font-medium leading-8"}>
                      13 August 2027
                    </span>
                  </p>
                  <p
                    className={
                      "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                    }
                  >
                    {t("time")}{" "}
                    <span className={"text-deep-100 font-medium leading-8"}>
                      11:00 AM - 13:00 PM{" "}
                    </span>
                  </p>
                </li>
              </ul>
              <p
                className={
                  "flex justify-between items-start text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("location")}{" "}
                <span
                  className={
                    "text-deep-100 font-medium leading-8 max-w-[39.9rem] text-right"
                  }
                >
                  Cap-Haïtien Cultural Center, Rue 20 Avenue, Cap-Haïtien, Haiti
                </span>
              </p>
            </div>
            <Separator />
            <div className={"w-full flex flex-col gap-8 py-6"}>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] text-neutral-600"
                }
              >
                {t("class")}{" "}
                <span
                  className={
                    "text-deep-100 flex items-center gap-4 font-medium leading-6 "
                  }
                >
                  1X
                  <span
                    className={`py-[0.3rem] px-2 bg-neutral-200 text-[#EF1870] font-bold rounded-[30px] text-[11px]`}
                  >
                    GENERAL
                  </span>
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("price")}{" "}
                <span className={"text-deep-100 font-medium leading-8"}>
                  400 HTG
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("ticket_id")}{" "}
                <span className={"text-deep-100 font-medium leading-8"}>
                  #TICK1234567
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("total")}{" "}
                <span className={"text-deep-100  font-medium leading-8"}>
                  400 {""} HTG
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
                {t("transaction_id")}{" "}
                <span className={"text-deep-100 font-medium leading-8"}>
                  Jean Baptiste
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("payment_method")}{" "}
                <span className={"text-deep-100 font-medium leading-8"}>
                  Card
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("payment_date")}{" "}
                <span className={"text-deep-100 font-medium leading-8"}>
                  23 May 2026, 12:00 AM
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("transaction_status")}{" "}
                <span className={"text-deep-100 font-medium leading-8"}>
                  jean@gmail.com
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
                {t("check_status")}{" "}
                <span className={"text-deep-100 font-medium leading-8"}>
                  <span
                    className={`py-[0.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase  text-success px-2 rounded-[30px] bg-neutral-200`}
                  >
                    CHECKED
                  </span>
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("check_time")}{" "}
                <span className={"text-deep-100 font-medium leading-8"}>
                  12 May 2026, 12:00 AM
                </span>
              </p>
              <div></div>
            </div>
          </div>
        </DrawerDescription>
      </div>

      <DrawerFooter>
        <DrawerClose asChild className={"flex-1 cursor-pointer"}>
          <ButtonAccent className={"w-full"}>
            {t("close")}
          </ButtonAccent>
        </DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  );
}
