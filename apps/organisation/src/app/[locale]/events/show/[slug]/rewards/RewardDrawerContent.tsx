"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ActivityReward } from "@ticketwaze/typescript-config";
import { useLocale, useTranslations } from "next-intl";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ButtonPrimary } from "@/components/shared/buttons";
import { Input } from "@/components/shared/Inputs";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { usePathname } from "@/i18n/navigation";
import { CreateReward, UpdateReward } from "@/actions/RewardActions";

/** Mirrors the API validator: below 2, a "reward" is just a lower price. */
const MIN_REQUIRED_QUANTITY = 2;
const MAX_REQUIRED_QUANTITY = 100;

/**
 * The create AND edit form.
 *
 * One component for both because the fields are identical and the difference is
 * a single branch on submit — two copies would be two places to add the next
 * field and one place to forget it.
 */
export default function RewardDrawerContent({
  activityId,
  reward,
}: {
  activityId: string;
  reward: ActivityReward | null;
}) {
  const t = useTranslations("Events.single_event.rewards");
  const locale = useLocale();
  const pathname = usePathname();
  const closeRef = useRef<HTMLButtonElement>(null);

  const RewardSchema = z.object({
    name: z
      .string()
      .trim()
      .min(2, { error: t("errors.name.min") })
      .max(40, { error: t("errors.name.max") }),
    requiredQuantity: z
      .string()
      .min(1, { error: t("errors.required_quantity.min") })
      .refine((value) => Number(value) >= MIN_REQUIRED_QUANTITY, {
        error: t("errors.required_quantity.min"),
      })
      .refine((value) => Number(value) <= MAX_REQUIRED_QUANTITY, {
        error: t("errors.required_quantity.max"),
      }),
    /** Blank means unlimited, which is what a null stock means to the API. */
    stock: z
      .string()
      .optional()
      .refine((value) => !value || Number(value) >= 1, {
        error: t("errors.stock.min"),
      }),
  });

  type TRewardSchema = z.infer<typeof RewardSchema>;

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<TRewardSchema>({
    resolver: zodResolver(RewardSchema),
    defaultValues: {
      name: reward?.name ?? "",
      requiredQuantity: String(reward?.requiredQuantity ?? ""),
      stock:
        reward?.stock === null || reward?.stock === undefined
          ? ""
          : String(reward.stock),
    },
  });

  async function submitHandler(data: TRewardSchema) {
    const payload = {
      name: data.name.trim(),
      requiredQuantity: Number(data.requiredQuantity),
      // An empty field is "unlimited", sent explicitly as null so editing a
      // capped reward back to unlimited actually clears the cap.
      stock: data.stock ? Number(data.stock) : null,
    };

    const result = reward
      ? await UpdateReward(
          activityId,
          reward.rewardId,
          payload,
          pathname,
          locale,
        )
      : await CreateReward(activityId, payload, pathname, locale);

    if (result.error) return toast.error(result.error);
    toast.success(reward ? t("updated") : t("created"));
    closeRef.current?.click();
  }

  return (
    <DrawerContent className="my-6 bg-white p-[30px] rounded-[30px] lg:w-[580px]">
      <div className="w-full flex flex-col items-center overflow-y-scroll">
        <DrawerTitle className="pb-[40px]">
          <span className="font-primary font-medium text-center text-[2.6rem] leading-[30px] text-black">
            {reward ? t("edit") : t("create")}
          </span>
        </DrawerTitle>
        <DrawerDescription className="sr-only">{t("intro")}</DrawerDescription>

        <div className="w-full flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Input
              type="text"
              {...register("name")}
              error={errors.name?.message}
              autoFocus
            >
              {t("name")}
            </Input>
            <span className="text-[1.2rem] px-8 text-neutral-600">
              {t("name_hint")}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <Input
              type="number"
              min={MIN_REQUIRED_QUANTITY}
              max={MAX_REQUIRED_QUANTITY}
              {...register("requiredQuantity")}
              error={errors.requiredQuantity?.message}
            >
              {t("required_quantity")}
            </Input>
            <span className="text-[1.2rem] px-8 text-neutral-600">
              {t("required_quantity_hint")}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <Input
              type="number"
              min={1}
              {...register("stock")}
              error={errors.stock?.message}
            >
              {t("stock")}
            </Input>
            <span className="text-[1.2rem] px-8 text-neutral-600">
              {t("stock_hint")}
            </span>
          </div>
        </div>
      </div>

      <DrawerFooter>
        <div className="flex gap-8">
          <DrawerClose ref={closeRef} className="flex-1 cursor-pointer">
            <div className="w-full border-primary-500 text-primary-500 bg-primary-100 px-[3rem] py-[15px] border-2 rounded-[100px] text-center font-medium text-[1.5rem] h-auto leading-8 cursor-pointer transition-all duration-400 flex items-center justify-center">
              {t("close")}
            </div>
          </DrawerClose>
          {/* The submit is wrapped rather than passed directly: `submitHandler`
              closes the drawer through a ref, and handing that straight to a
              prop reads the ref during render. */}
          <ButtonPrimary
            onClick={() => handleSubmit(submitHandler)()}
            className="flex-1"
          >
            {isSubmitting ? (
              <LoadingCircleSmall />
            ) : reward ? (
              t("save")
            ) : (
              t("add")
            )}
          </ButtonPrimary>
        </div>
      </DrawerFooter>
    </DrawerContent>
  );
}
