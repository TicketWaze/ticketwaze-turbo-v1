"use client";
import { useEffect, useRef, useState } from "react";
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
import {
  ChangeWithdrawalPin,
  CreateWithdrawalPin,
} from "@/actions/organisationActions";
import { toast } from "sonner";
import { InfoCircle } from "iconsax-reactjs";
import PageLoader from "@/components/PageLoader";
import maskEmail from "@/lib/maskEmail";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";

export default function PinHandler({
  organisation,
}: {
  organisation: Organisation;
}) {
  const t = useTranslations("Settings.payment");
  const locale = useLocale();
  const { data: session } = useSession();
  const closeRef = useRef<HTMLButtonElement>(null);
  const searchParams = useSearchParams();
  const action = searchParams.get("action");
  const redirectTo = searchParams.get("redirectTo");
  const [isPinOpen, setIsPinOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (action === "pin") {
      setIsPinOpen(true);
    }
  }, [action]);
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
  const [isLoading, setIsLoading] = useState(false);
  async function createPin(data: TCreatePinSchema) {
    const response = await CreateWithdrawalPin(
      organisation.organisationId,
      session?.user.accessToken ?? "",
      data,
      locale,
    );
    if (response.status === "success") {
      toast.success(t("pinCreated"));
      if (redirectTo && redirectTo.trim().length > 0) {
        setIsLoading(true);
        router.push(`${redirectTo}`);
      }
      closeRef.current?.click();
    } else {
      toast.error(t("pinFailed"));
    }
  }
  async function changePin() {
    setIsLoading(true);
    const result = await ChangeWithdrawalPin(
      organisation.organisationId,
      session?.user.accessToken ?? "",
      locale,
    );
    if (result.status === "success") {
      toast.success(
        `${t("description")} ${maskEmail(organisation.organisationEmail)}`,
      );
      closeRef.current?.click();
    } else if (result.status === "waiting") {
      const date = new Date(result.nextAllowedAt);
      const now = new Date();
      const diff = date.getTime() - now.getTime();
      const hoursRemaining = Math.floor(diff / (1000 * 60 * 60));
      const minutesRemaining = Math.ceil(
        (diff % (1000 * 60 * 60)) / (1000 * 60),
      );
      toast.info(
        `${t("newRequest")} ${hoursRemaining > 0 ? `${hoursRemaining}h` : ""} ${minutesRemaining}m`,
      );
    } else {
      toast.error(result.error);
    }
    setIsLoading(false);
  }
  return (
    <>
      <PageLoader isLoading={isLoading} />
      {organisation.withdrawalPin ? (
        <Dialog>
          <DialogTrigger asChild>
            <ButtonAccent className="w-full">{t("change_pin")}</ButtonAccent>
          </DialogTrigger>
          <DialogContent className={"w-[360px] lg:w-[520px] "}>
            <DialogHeader>
              <DialogTitle
                className={
                  "font-medium border-b border-neutral-100 pb-[2rem]  text-[2.6rem] leading-[30px] text-black font-primary"
                }
              >
                {t("change_pin")}
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
                {t("changePinAlert")}
              </p>
            </div>
            <DialogFooter>
              <ButtonPrimary
                onClick={changePin}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? <LoadingCircleSmall /> : t("proceed")}
              </ButtonPrimary>
              <DialogClose ref={closeRef} className="sr-only"></DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Dialog open={isPinOpen} onOpenChange={setIsPinOpen}>
          {/* <DialogTrigger asChild> */}
          <ButtonAccent onClick={() => setIsPinOpen(true)} className="w-full">
            {t("create_pin")}
          </ButtonAccent>
          {/* </DialogTrigger> */}
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
                onClick={() => handleSubmit(createPin)}
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
