"use client";
import { LinkPrimary } from "@/components/shared/Links";
import { InfoCircle } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { Organisation } from "@ticketwaze/typescript-config";

export default function InitiateWithdrawalButton({
  organisation,
}: {
  organisation: Organisation;
}) {
  const t = useTranslations("Finance");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  if (!organisation.withdrawalPin) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <ButtonPrimary>{t("withdraw_btn")}</ButtonPrimary>
        </DialogTrigger>
        <DialogContent className={"w-[360px] lg:w-[520px] "}>
          <DialogHeader>
            <DialogTitle
              className={
                "font-medium border-b border-neutral-100 pb-[2rem]  text-[2.6rem] leading-[30px] text-black font-primary"
              }
            >
              {t("withdraw_btn")}
            </DialogTitle>
            <DialogDescription className={"sr-only"}>
              <span>Add artist</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 flex flex-col gap-8 items-center">
            <div
              className={
                "w-[100px] h-[100px] rounded-full flex items-center justify-center bg-neutral-100"
              }
            >
              <div
                className={
                  "w-[70px] h-[70px] rounded-full flex items-center justify-center bg-neutral-200"
                }
              >
                <InfoCircle size="30" color="#0d0d0d" variant="Bulk" />
              </div>
            </div>
            <p
              className={`font-sans text-[1.4rem] leading-[25px] text-deep-100 text-center w-[320px] lg:w-full`}
            >
              {t("noPinWarning")}
            </p>
          </div>
          <DialogFooter>
            <ButtonPrimary
              onClick={() => {
                setIsLoading(true);
                router.push("/settings/payment");
              }}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <LoadingCircleSmall /> : t("proceed")}
            </ButtonPrimary>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  } else if (
    !organisation.bankAccountName ||
    !organisation.bankAccountNumber ||
    !organisation.bankName
  ) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <ButtonPrimary>{t("withdraw_btn")}</ButtonPrimary>
        </DialogTrigger>
        <DialogContent className={"w-[360px] lg:w-[520px] "}>
          <DialogHeader>
            <DialogTitle
              className={
                "font-medium border-b border-neutral-100 pb-[2rem]  text-[2.6rem] leading-[30px] text-black font-primary"
              }
            >
              {t("withdraw_btn")}
            </DialogTitle>
            <DialogDescription className={"sr-only"}>
              <span>Add artist</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 flex flex-col gap-8 items-center">
            <div
              className={
                "w-[100px] h-[100px] rounded-full flex items-center justify-center bg-neutral-100"
              }
            >
              <div
                className={
                  "w-[70px] h-[70px] rounded-full flex items-center justify-center bg-neutral-200"
                }
              >
                <InfoCircle size="30" color="#0d0d0d" variant="Bulk" />
              </div>
            </div>
            <p
              className={`font-sans text-[1.4rem] leading-[25px] text-deep-100 text-center w-[320px] lg:w-full`}
            >
              {t("noBankingInfo")}
            </p>
          </div>
          <DialogFooter>
            <ButtonPrimary
              onClick={() => {
                setIsLoading(true);
                router.push("/settings/payment");
              }}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <LoadingCircleSmall /> : t("proceed")}
            </ButtonPrimary>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  } else {
    return (
      <LinkPrimary href={"/finance/initiate-withdrawal"}>
        {t("withdraw_btn")}
      </LinkPrimary>
    );
  }
}
