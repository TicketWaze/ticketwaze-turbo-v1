"use client";
import {
  DeleteBankingInformations,
  UpdateOrganisationPaymentInformation,
} from "@/actions/organisationActions";
import PageLoader from "@/components/PageLoader";
import { ButtonPrimary, ButtonRed } from "@/components/shared/buttons";
import { Input } from "@/components/shared/Inputs";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { Organisation } from "@ticketwaze/typescript-config";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import PinHandler from "./PinHandler";

export default function PaymentInformationsForm({
  organisation,
}: {
  organisation: Organisation;
}) {
  const t = useTranslations("Settings.payment");
  const locale = useLocale();
  const { data: session } = useSession();
  const closeRef = useRef<HTMLButtonElement>(null);
  const PaymentDetailsSchema = z.object({
    bankName: z.string().min(1, t("errors.bank_name")),
    bankAccountName: z.string().min(1, t("errors.bank_account_name")),
    bankAccountNumber: z.string().min(1, t("errors.bank_account_number")),
  });
  type TPaymentDetailsSchema = z.infer<typeof PaymentDetailsSchema>;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TPaymentDetailsSchema>({
    resolver: zodResolver(PaymentDetailsSchema),
    values: {
      bankAccountName: organisation.bankAccountName ?? "",
      bankAccountNumber: organisation.bankAccountNumber ?? "",
      bankName: organisation.bankName ?? "",
    },
  });

  async function submitHandler(data: TPaymentDetailsSchema) {
    const result = await UpdateOrganisationPaymentInformation(
      organisation?.organisationId ?? "",
      data.bankName,
      data.bankAccountName,
      data.bankAccountNumber,
      session?.user.accessToken ?? "",
      locale,
    );

    if (result.status === "success") {
      toast.success("Success");
    } else {
      toast.error(result.error);
    }
  }

  const [organisationName, setOrganisationName] = useState("");
  const [isLoading, setIsloading] = useState(false);
  async function clearBankingInfo() {
    if (
      !organisation.bankName ||
      !organisation.bankAccountName ||
      !organisation.bankAccountNumber
    ) {
      toast.warning(t("noBankingInfo"));
      closeRef.current?.click();
      return;
    }
    setIsloading(true);
    try {
      const response = await DeleteBankingInformations(
        organisation.organisationId,
        session?.user.accessToken!,
        locale,
      );
      if (response.status === "success") {
        toast.success(t("successDelete"));
        closeRef.current?.click();
      } else {
        throw new Error();
      }
    } catch (error) {
      toast.error(t("failedDelete"));
    }
    setIsloading(false);
  }

  return (
    <div
      className={
        "flex flex-col overflow-y-scroll overflow-x-hidden gap-16 w-full h-full  lg:w-212 mx-auto"
      }
    >
      <PageLoader isLoading={isLoading || isSubmitting} />
      <form
        id="payment-form"
        onSubmit={handleSubmit(submitHandler)}
        className={"flex h-[70vh] flex-col gap-8"}
      >
        <span
          className={"pb-4 font-medium text-[1.8rem] leading-10 text-deep-100"}
        >
          {t("subtitle")}
        </span>

        <div
          className={
            "border border-neutral-100 rounded-[10px] p-10 flex flex-col gap-10"
          }
        >
          <span
            className={
              "font-semibold text-[16px] leading-[2.2rem] text-deep-100"
            }
          >
            {t("bank")}
          </span>
          <Input
            {...register("bankName")}
            type="text"
            disabled={isSubmitting}
            error={errors.bankName?.message}
          >
            {t("bank_name")}
          </Input>
          <Input
            {...register("bankAccountName")}
            type="text"
            disabled={isSubmitting}
            error={errors.bankAccountName?.message}
          >
            {t("bank_account_name")}
          </Input>
          <Input
            {...register("bankAccountNumber")}
            type="text"
            disabled={isSubmitting}
            error={errors.bankAccountNumber?.message}
          >
            {t("bank_account_number")}
          </Input>
        </div>
      </form>
      <div className="lg:hidden w-full">
        <PinHandler organisation={organisation} />
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <ButtonRed disabled={isSubmitting} className="w-full">
            {t("clearBanking")}
          </ButtonRed>
        </DialogTrigger>
        <DialogContent className={"w-[360px] lg:w-[520px] "}>
          <DialogHeader>
            <DialogTitle
              className={
                "font-medium border-b border-neutral-100 pb-[2rem]  text-[2.6rem] leading-[30px] text-black font-primary"
              }
            >
              {t("clearBanking")}
            </DialogTitle>
            <DialogDescription className={"sr-only"}>
              <span>Add artist</span>
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
              {t("deleteBankinfWarning")}
            </p>
            <div className="w-full">
              <Input
                autoFocus={false}
                onChange={(e) => setOrganisationName(e.target.value)}
                value={organisationName}
              >
                {t("type")}
              </Input>
            </div>
          </div>
          <DialogFooter>
            <ButtonPrimary
              onClick={clearBankingInfo}
              disabled={
                isSubmitting ||
                isLoading ||
                organisationName !== organisation.organisationName
              }
              className="w-full"
            >
              {isLoading ? <LoadingCircleSmall /> : t("clearBanking")}
            </ButtonPrimary>
            <DialogClose ref={closeRef} className="sr-only"></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div></div>
    </div>
  );
}
