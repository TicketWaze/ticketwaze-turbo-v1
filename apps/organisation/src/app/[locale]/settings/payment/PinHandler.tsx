"use client";
import { useRef } from "react";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { ButtonAccent, ButtonPrimary } from "@/components/shared/buttons";
import { useLocale, useTranslations } from "next-intl";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { useSession } from "next-auth/react";
import { Organisation } from "@ticketwaze/typescript-config";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateWithdrawalPin } from "@/actions/organisationActions";
import { toast } from "sonner";
import { LinkAccent } from "@/components/shared/Links";

export default function PinHandler({
  organisation,
}: {
  organisation: Organisation;
}) {
  const t = useTranslations("Settings.payment");
  const locale = useLocale();
  const { data: session } = useSession();
  const closeRef = useRef<HTMLButtonElement>(null);
  const CreatePinSchema = z
    .object({
      withdrawalPin: z.string(),
      withdrawalPin_confirmation: z.string(),
    })
    .refine((data) => data.withdrawalPin === data.withdrawalPin_confirmation, {
      message: t("pinMismatch"),
      path: ["withdrawalPin_confirmation"],
    });
  type TCreatePinSchema = z.infer<typeof CreatePinSchema>;
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TCreatePinSchema>({
    resolver: zodResolver(CreatePinSchema),
  });
  async function createPin(data: TCreatePinSchema) {
    const response = await CreateWithdrawalPin(
      organisation.organisationId,
      session?.user.accessToken!,
      data,
      locale,
    );
    if (response.status === "success") {
      toast.success(t("pinCreated"));
      closeRef.current?.click();
    } else {
      toast.error(t("pinFailed"));
    }
  }
  return (
    <>
      {organisation.withdrawalPin ? (
        <LinkAccent href="#">{t("change_pin")}</LinkAccent>
      ) : (
        <Dialog>
          <DialogTrigger asChild>
            <ButtonAccent className="w-full hidden lg:flex">
              {t("create_pin")}
            </ButtonAccent>
          </DialogTrigger>
          <DialogContent className={"w-[360px] lg:w-[377px] "}>
            <DialogHeader>
              <DialogTitle
                className={
                  "font-medium border-b border-neutral-100 pb-[2rem]  text-[2.6rem] leading-[30px] text-black font-primary"
                }
              >
                {t("create_pin")}
              </DialogTitle>
              <DialogDescription className={"sr-only"}>
                <span>Add artist</span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                {t("enter")}
              </span>
              <Controller
                control={control}
                name="withdrawalPin"
                render={({ field }) => (
                  <InputOTP
                    {...field}
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
                )}
              />
              {errors.withdrawalPin && (
                <span className="text-[1.2rem] px-8 py-2 text-failure">
                  {errors.withdrawalPin?.message}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                {t("confirm")}
              </span>
              <Controller
                control={control}
                name="withdrawalPin_confirmation"
                render={({ field }) => (
                  <InputOTP
                    {...field}
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
                )}
              />
              {errors.withdrawalPin_confirmation && (
                <span className="text-[1.2rem] px-8 py-2 text-failure">
                  {errors.withdrawalPin_confirmation?.message}
                </span>
              )}
            </div>
            <DialogFooter className="mt-8">
              <ButtonPrimary
                onClick={handleSubmit(createPin)}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? <LoadingCircleSmall /> : t("create_pin")}
              </ButtonPrimary>
              <DialogClose ref={closeRef} className="sr-only"></DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
