"use client";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import FormatDate from "@/lib/FormatDate";
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import Separator from "@/components/shared/Separator";
import { ButtonAccent } from "@/components/shared/buttons";
import { Order } from "@ticketwaze/typescript-config";

export default function WalletOrderDrawerContent({ order }: { order: Order }) {
  const t = useTranslations("Wallet");
  const { data: session } = useSession();
  return (
    <DrawerContent className={"my-6 p-[30px] rounded-[30px] w-full"}>
      <div className={"w-full flex flex-col items-center overflow-y-scroll"}>
        <DrawerTitle className={"pb-[40px]"}>
          <span
            className={
              "font-primary font-medium text-center text-[2.6rem] leading-[30px] text-black"
            }
          >
            Transaction Details
          </span>
        </DrawerTitle>
        <DrawerDescription asChild className="w-full">
          <div className="flex flex-col gap-8">
            <div className={"w-full flex flex-col gap-8"}>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-[20px] text-neutral-600"
                }
              >
                {t("transactions.details.transaction_id")}{" "}
                <span className={"text-deep-100 font-medium leading-[20px]"}>
                  {order.orderName}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-[20px] text-neutral-600"
                }
              >
                {t("transactions.details.email")}{" "}
                <span className={"text-deep-100 font-medium leading-[20px]"}>
                  {session?.user.email}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-[20px] text-neutral-600"
                }
              >
                {t("transactions.details.ticket_class")}{" "}
                <span className={"text-deep-100 font-medium leading-[20px]"}>
                  {order.tickets.length}
                </span>
              </p>
            </div>
            <Separator />
            <div className={"w-full flex flex-col gap-8"}>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-[20px] text-neutral-600"
                }
              >
                {t("transactions.table.provider")}
                <span className={"text-deep-100 font-medium leading-[20px]"}>
                  {order.provider.toUpperCase()}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-[20px] text-neutral-600"
                }
              >
                {t("transactions.details.price")}{" "}
                <span className={"text-deep-100 font-medium leading-[20px]"}>
                  {session?.user.userPreference.currency === "USD"
                    ? `${order.usdPrice} USD`
                    : `${order.amount} HTG`}
                </span>
              </p>
            </div>
            <Separator />
            <div className={"w-full flex flex-col gap-8"}>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-[20px] text-neutral-600"
                }
              >
                {t("transactions.details.check_status")}{" "}
                <span className={"text-deep-100 font-medium leading-[20px]"}>
                  <span
                    className={`py-[3px] text-[1.1rem] font-bold leading-[15px] text-center uppercase ${order.status === "SUCCESSFUL" ? "text-success" : "text-warning"} px-[5px] rounded-[30px] bg-[#f5f5f5]`}
                  >
                    {order.status}
                  </span>
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-[20px] text-neutral-600"
                }
              >
                {t("transactions.details.payment_date")}{" "}
                <span className={"text-deep-100 font-medium leading-[20px]"}>
                  {FormatDate(order.createdAt)}
                </span>
              </p>
            </div>
            <div className={"w-full flex flex-col gap-8"}>
              <div></div>
            </div>
          </div>
        </DrawerDescription>
      </div>

      <DrawerFooter>
        <div className={"flex gap-8"}>
          <DrawerClose asChild className={"flex-1 cursor-pointer"}>
            <ButtonAccent className={"w-full"}>
              {t("transactions.details.close")}
            </ButtonAccent>
          </DrawerClose>
        </div>
      </DrawerFooter>
    </DrawerContent>
  );
}
