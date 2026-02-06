"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft2,
  ArrowRight2,
  InfoCircle,
  MoneyRecive,
} from "iconsax-reactjs";
import { motion } from "motion/react";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import BackButton from "@/components/shared/BackButton";
import { Organisation } from "@ticketwaze/typescript-config";
import { useSession } from "next-auth/react";
import Image from "next/image";
import moncash from "@/assets/images/moncash-icon.svg";
import natcash from "@/assets/images/natcash.png";
import { toast } from "sonner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { BankWithdrawalRequest } from "@/actions/organisationActions";
import PageLoader from "@/components/PageLoader";
import { useRouter } from "@/i18n/navigation";

export default function InitiateWithdrawalPageWrapper({
  organisation,
}: {
  organisation: Organisation;
}) {
  const t = useTranslations("Finance");
  const locale = useLocale();
  const { data: session } = useSession();

  const [previousStep, setPreviousStep] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [accountType, setAccountType] = useState<string | null>(null);
  const [pin, setPin] = useState<string | null>(null);
  const [pinConfirmation, setPinConfirmation] = useState<string | null>(null);
  const [isLoading, setIsloading] = useState(false);
  const delta = currentStep - previousStep;
  const router = useRouter();

  async function submitBankWithdrawalRequest() {
    setIsloading(true);
    const result = await BankWithdrawalRequest(
      organisation.organisationId,
      session?.user.accessToken ?? "",
      locale,
      { accountType, pin, pin_confirmation: pinConfirmation },
    );
    if (result.status === "success") {
      toast.success(t("withdrawSuccess"));
      router.push("/finance");
    } else if (result.error === "pin") {
      toast.error(t("errors.incorrectPin"));
      setPin(null);
      setPinConfirmation(null);
    } else if (result.error === "Unauthorized") {
      toast.error(t("errors.Unauthorized"));
    } else {
      toast.error(result.error);
    }
    setIsloading(false);
  }

  const next = async () => {
    if (currentStep === 1) {
      if (!accountType) {
        toast.error(t("accountTypeError"));
        return;
      }
    }
    if (currentStep === 2) {
      if (!pin || pin.trim().length !== 4) {
        toast.error(t("errors.noPin"));
        return;
      } else if (!pinConfirmation || pinConfirmation.trim().length !== 4) {
        toast.error(t("errors.noPinConfirmation"));
        return;
      } else if (pin.trim() !== pinConfirmation.trim()) {
        toast.error(t("errors.pinNotSame"));
        setPinConfirmation(null);
        return;
      } else {
        if (organisation.availableBalance <= 0) {
          toast.error(t("errors.insufficient"));
          return;
        }
        if (accountType === "bank") {
          await submitBankWithdrawalRequest();
        }
        return;
      }
    }
    setPreviousStep(currentStep);
    setCurrentStep((s) => s + 1);
  };

  const prev = () => {
    if (currentStep > 0) {
      setPreviousStep(currentStep);
      setCurrentStep((s) => s - 1);
    }
  };

  async function proccessAccount(accountType: string) {
    if (accountType !== "bank") {
      toast.info(t("soon"));
    } else {
      setAccountType("bank");
    }
  }

  return (
    <>
      <PageLoader isLoading={isLoading} />
      <div className="relative flex flex-col gap-8 overflow-hidden h-full ">
        <div className="absolute bottom-4 z-[9999] w-full hidden lg:block">
          <ButtonPrimary
            onClick={next}
            className=" w-full max-w-[530px] mx-auto  "
            disabled={isLoading}
          >
            {false ? <LoadingCircleSmall /> : t("proceed")}
          </ButtonPrimary>
        </div>

        <div className="fixed lg:hidden bottom-36 w-full px-8 z-50 left-0">
          <div className=" lg:hidden bg-white mx-auto border border-neutral-100 px-4 py-[5px] flex justify-between items-center rounded-[100px]">
            <div className="text-[2.2rem] text-neutral-600">
              <span className="text-primary-500">{currentStep + 1}</span>/3
            </div>
            <ButtonPrimary disabled={isLoading} onClick={next}>
              {isLoading ? <LoadingCircleSmall /> : t("proceed")}
            </ButtonPrimary>
          </div>
        </div>

        {currentStep === 0 ? (
          <BackButton text={t("back")}>
            <div className="flex justify-between">
              <div className="hidden lg:flex items-center gap-4">
                <span className="text-primary-500 font-medium text-[1.5rem] leading-[3rem] ">
                  {t("summary")}
                </span>
                <div className="w-[161px] h-[5px] rounded-[100px] bg-neutral-100" />
                <span className="text-neutral-500 font-medium text-[1.5rem] leading-[3rem] ">
                  {t("bank_details")}
                </span>
                <div className="w-[161px] h-[5px] rounded-[100px] bg-neutral-100" />
                <span className="text-neutral-500 font-medium text-[1.5rem] leading-[3rem] ">
                  {t("security")}
                </span>
              </div>
            </div>
          </BackButton>
        ) : (
          <div className="flex items-center justify-between">
            <button
              onClick={prev}
              className="flex max-w-[80px] cursor-pointer items-center gap-4"
            >
              <div className="w-[35px] h-[35px] rounded-full bg-neutral-100 flex items-center justify-center">
                <ArrowLeft2 size="20" color="#0d0d0d" variant="Bulk" />
              </div>
              <span className="text-neutral-700 font-normal text-[1.4rem] leading-8">
                {t("back")}
              </span>
            </button>
            <div className="hidden lg:flex items-center gap-4">
              <span className="text-primary-500 font-medium text-[1.5rem] leading-[3rem] ">
                {t("summary")}
              </span>
              <div className="w-[161px] h-[5px] rounded-[100px] bg-primary-500" />
              <span className="text-primary-500 font-medium text-[1.5rem] leading-[3rem] ">
                {t("bank_details")}
              </span>
              <div
                className={`w-[161px] h-[5px] rounded-[100px] ${currentStep === 2 ? "bg-primary-500" : "bg-neutral-100"}`}
              />
              <span
                className={`${currentStep === 2 ? "text-primary-500" : "text-neutral-500"} font-medium text-[1.5rem] leading-[3rem]`}
              >
                {t("security")}
              </span>
            </div>
          </div>
        )}

        <div className=" flex flex-col gap-12 h-full overflow-y-scroll overflow-x-hidden">
          {currentStep === 0 && (
            <motion.div
              initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              layout={false}
              className="flex flex-col gap-12"
            >
              <div
                className={
                  "flex flex-col overflow-y-scroll border border-neutral-100 rounded-[10px] overflow-x-hidden gap-6 items-center w-full h-full p-6 lg:w-212 mx-auto"
                }
              >
                <div className="py-12 flex flex-col items-center w-full gap-4 bg-neutral-100 rounded-[2rem]">
                  <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                    {t("amounts.availableBalance")}
                  </span>
                  <p className="font-primary font-bold text-[4.5rem] leading-[50px] text-black">
                    {session?.activeOrganisation?.currency === "HTG"
                      ? organisation.availableBalance
                      : organisation.usdAvailableBalance}
                    <span className={" text-neutral-500"}>
                      {" "}
                      {session?.activeOrganisation.currency}
                    </span>
                  </p>
                </div>
                <span className="text-[1.4rem] leading-8 text-neutral-600">
                  {t("breakdown")}
                </span>
                <div className="w-full flex flex-col gap-6">
                  <div className="w-full flex items-center justify-between">
                    <span className="text-[1.4rem] leading-8 text-neutral-600">
                      {t("amounts.pendingBalance")}
                    </span>
                    <span className="text-[1.4rem] leading-8 text-deep-100">
                      {session?.activeOrganisation?.currency === "HTG"
                        ? organisation.pendingBalance
                        : organisation.usdPendingBalance}{" "}
                      {session?.activeOrganisation.currency}
                    </span>
                  </div>
                  <div className="w-full flex items-center justify-between">
                    <span className="text-[1.4rem] leading-8 text-neutral-600">
                      {t("amounts.availableBalance")}
                    </span>
                    <span className="text-[1.4rem] leading-8 text-success">
                      {session?.activeOrganisation?.currency === "HTG"
                        ? organisation.availableBalance
                        : organisation.usdAvailableBalance}{" "}
                      {session?.activeOrganisation.currency}
                    </span>
                  </div>
                </div>
              </div>
              <div
                className={
                  "flex flex-col items-start lg:w-212 mx-auto gap-4 p-[15px] rounded-[15px] border border-neutral-100 text-[1.2rem] leading-8 text-neutral-700"
                }
              >
                <InfoCircle size="20" color="#E45B00" />
                {t("pendingAlert")}
              </div>
              <div></div>
              <div></div>
              <div></div>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-col gap-12"
            >
              <div
                className={
                  "flex flex-col overflow-y-scroll rounded-[10px] overflow-x-hidden gap-6 items-center w-full h-full lg:w-212 mx-auto"
                }
              >
                <button
                  className={`flex items-center w-full justify-between cursor-pointer p-[15px] rounded-[15px] border border-neutral-100 hover:border-primary-500 transition-all ease-in-out duration-300 ${accountType === "bank" ? "border-primary-500" : "border-neutral-100"}`}
                  onClick={() => proccessAccount("bank")}
                >
                  <div className={"flex items-center gap-4"}>
                    <MoneyRecive size="30" color="#0d0d0d" variant="Bulk" />
                    <span
                      className={
                        "font-semibold text-[1.6rem] leading-[22px] text-deep-100"
                      }
                    >
                      {t("bank")}
                    </span>
                  </div>
                  <ArrowRight2 size="20" color="#0d0d0d" variant="Bulk" />
                </button>
                <button
                  className={`flex items-center w-full justify-between cursor-pointer p-[15px] rounded-[15px] border hover:border-primary-500 transition-all ease-in-out duration-300 ${accountType === "moncash" ? "border-primary-500" : "border-neutral-100"}`}
                  onClick={() => proccessAccount("moncash")}
                >
                  <div className={"flex items-center gap-4"}>
                    <Image src={moncash} width={30} alt={"Logo of moncash"} />
                    <span
                      className={
                        "font-semibold text-[1.6rem] leading-[22px] text-deep-100"
                      }
                    >
                      {t("moncash")}
                    </span>
                  </div>
                  <ArrowRight2 size="20" color="#0d0d0d" variant="Bulk" />
                </button>
                <button
                  className={`flex items-center w-full justify-between cursor-pointer p-[15px] rounded-[15px] border hover:border-primary-500 transition-all ease-in-out duration-300 ${accountType === "natcash" ? "border-primary-500" : "border-neutral-100"}`}
                  onClick={() => proccessAccount("natcash")}
                >
                  <div className={"flex items-center gap-4"}>
                    <Image src={natcash} width={30} alt={"Logo of natcash"} />
                    <span
                      className={
                        "font-semibold text-[1.6rem] leading-[22px] text-deep-100"
                      }
                    >
                      {t("natcash")}
                    </span>
                  </div>
                  <ArrowRight2 size="20" color="#0d0d0d" variant="Bulk" />
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-col gap-12"
            >
              <div
                className={
                  "border border-neutral-100 w-full lg:w-[40rem] mx-auto rounded-[10px] p-10 flex flex-col gap-16"
                }
              >
                <div className="flex flex-col gap-8">
                  <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                    {t("pin")}
                  </span>
                  <InputOTP
                    onChange={(e) => setPin(e)}
                    value={pin ?? ""}
                    pattern={REGEXP_ONLY_DIGITS}
                    maxLength={4}
                  >
                    <InputOTPGroup className="flex justify-between w-full">
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <div className="flex flex-col gap-8">
                  <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                    {t("confirmPin")}
                  </span>
                  <InputOTP
                    onChange={(e) => setPinConfirmation(e)}
                    value={pinConfirmation ?? ""}
                    pattern={REGEXP_ONLY_DIGITS}
                    maxLength={4}
                  >
                    <InputOTPGroup className="flex justify-between w-full">
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
