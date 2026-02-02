"use client";
import { NewWithdrawalPin } from "@/actions/organisationActions";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useSession } from "next-auth/react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useLocale, useTranslations } from "use-intl";
import { z } from "zod/v4";

export default function NewPinForm({
  changePinToken,
}: {
  changePinToken: string;
}) {
  const t = useTranslations("Settings.payment");
  const locale = useLocale();
  const { data: session } = useSession();
  const router = useRouter();
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
  async function submitHandler(data: TCreatePinSchema) {
    const result = await NewWithdrawalPin(
      session?.activeOrganisation.organisationId!,
      session?.user.accessToken!,
      locale,
      changePinToken,
      data,
    );
    if (result.status === "success") {
      toast.success("Success");
      router.push("/settings/payment");
    } else {
      toast.error(result.error);
    }
  }
  return (
    <form
      id="payment-form"
      onSubmit={handleSubmit(submitHandler)}
      className={"flex flex-col gap-8 w-full lg:w-170 mx-auto"}
    >
      <div
        className={
          "border border-neutral-100 rounded-[10px] p-10 flex flex-col gap-16"
        }
      >
        <div className="flex flex-col gap-8">
          <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
            {t("enter")}
          </span>
          <Controller
            control={control}
            name="withdrawalPin"
            render={({ field }) => (
              <InputOTP {...field} pattern={REGEXP_ONLY_DIGITS} maxLength={4}>
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
        <div className="flex flex-col gap-8">
          <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
            {t("confirm")}
          </span>
          <Controller
            control={control}
            name="withdrawalPin_confirmation"
            render={({ field }) => (
              <InputOTP {...field} pattern={REGEXP_ONLY_DIGITS} maxLength={4}>
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
      </div>
      <ButtonPrimary type="submit" disabled={isSubmitting}>
        {isSubmitting ? <LoadingCircleSmall /> : t("new_pin")}
      </ButtonPrimary>
    </form>
  );
}
