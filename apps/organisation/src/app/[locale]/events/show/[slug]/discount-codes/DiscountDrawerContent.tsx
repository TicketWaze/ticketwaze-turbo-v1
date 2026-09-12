"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Event } from "@ticketwaze/typescript-config";
import { RefreshCircle, Warning2 } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ButtonPrimary } from "@/components/shared/buttons";
import { Input } from "@/components/shared/Inputs";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { usePathname } from "@/i18n/navigation";
import { generateDiscountCode } from "@/lib/GenerateDiscountCode";
import { CreateDiscountCode } from "@/actions/DiscountCodeActions";

/** Percentages cannot exceed this. Mirrors the API validator. */
const MAX_PERCENTAGE = 100;

export default function DiscountDrawerContent({ event }: { event: Event }) {
  const t = useTranslations("Events.single_event.discount");
  const locale = useLocale();
  const pathname = usePathname();

  /**
   * THE VALUE'S CEILING DEPENDS ON THE TYPE, so it is a cross-field rule.
   *
   * A percentage over 100 is nonsense; a fixed 500 HTG is ordinary. The form
   * used to bound neither — `type` was a bare `z.string()` and `value` only
   * had to be at least 1 — so it happily submitted a 500% code. The API now
   * refuses that, but catching it here is the difference between an inline
   * message and a round trip.
   */
  const DiscountCodeSchema = z
    .object({
      code: z
        .string()
        .trim()
        .min(4, { error: t("errors.code.min") })
        .max(20, { error: t("errors.code.max") })
        .regex(/^[A-Za-z0-9]+$/, { error: t("errors.code.format") }),
      type: z.enum(["percentage", "fixed"]),
      value: z
        .string()
        .min(1, { error: t("errors.value.min") })
        .refine((val) => Number(val) >= 1, {
          error: t("errors.value.negative"),
        }),
      expiresIn: z
        .string()
        .min(1, { error: t("errors.expiresIn.min") })
        .refine((val) => Number(val) >= 1 && Number(val) <= 730, {
          error: t("errors.expiresIn.negative"),
        }),
      usageLimit: z
        .string()
        .min(1, { error: t("errors.quantity.min") })
        .refine((val) => Number(val) >= 1, {
          error: t("errors.quantity.negative"),
        }),
      perUserLimit: z.string().optional(),
      minPurchase: z.string().optional(),
    })
    .refine(
      (data) =>
        data.type !== "percentage" || Number(data.value) <= MAX_PERCENTAGE,
      { path: ["value"], error: t("errors.value.percentage") },
    );

  type TDiscountCodeSchema = z.infer<typeof DiscountCodeSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<TDiscountCodeSchema>({
    resolver: zodResolver(DiscountCodeSchema),
    defaultValues: { type: "percentage" },
  });

  const type = watch("type");

  async function submitHandler(data: TDiscountCodeSchema) {
    /**
     * NUMBERS AS NUMBERS. The form works in strings, and the API validator
     * takes `vine.number()` — which coerces, but only for the fields it
     * expects. The optional ones are omitted entirely rather than sent as
     * empty strings, which is what "no limit" means to the API.
     */
    const result = await CreateDiscountCode(
      event.eventId,
      {
        code: data.code.toUpperCase(),
        type: data.type,
        value: Number(data.value),
        expiresIn: Number(data.expiresIn),
        usageLimit: Number(data.usageLimit),
        ...(data.perUserLimit ? { perUserLimit: Number(data.perUserLimit) } : {}),
        ...(data.minPurchase ? { minPurchase: Number(data.minPurchase) } : {}),
      },
      pathname,
      locale,
    );

    if (result.error) return toast.error(result.error);
    toast.success(t("created"));
  }

  const fieldClass =
    "bg-neutral-100 w-full rounded-[5rem] py-4 px-8 text-[1.5rem] leading-8 placeholder:text-neutral-600 text-deep-200 outline-none border disabled:text-neutral-600 disabled:cursor-not-allowed border-transparent focus:border-primary-500 flex items-center";

  return (
    <DrawerContent className="my-6 bg-white p-[30px] rounded-[30px] lg:w-[580px]">
      <div className="w-full flex flex-col items-center overflow-y-scroll">
        <DrawerTitle className="pb-[40px]">
          <span className="font-primary font-medium text-center text-[2.6rem] leading-[30px] text-black">
            {t("title")}
          </span>
        </DrawerTitle>
        <DrawerDescription className="sr-only">
          {t("subtitle")}
        </DrawerDescription>

        <div className="w-full flex flex-col gap-6">
          {/*
            WHO PAYS FOR THIS, said before the organiser commits to it.

            A discount comes out of the organisation's proceeds, and so does
            the fee shortfall it causes — Ticketwaze's margin is pinned to the
            price they listed. That is a reasonable rule and a surprising one,
            so it is stated on the form rather than discovered on a payout.
          */}
          <div className="flex items-start gap-3 rounded-[15px] bg-[#FFF7ED] border border-[#FDBA74] px-[1.5rem] py-[1.2rem]">
            <Warning2
              size="18"
              color="#ea961c"
              variant="TwoTone"
              className="shrink-0 mt-[2px]"
            />
            <p className="text-[1.3rem] leading-7 text-[#9a5b00]">
              {t("cost_notice")}
            </p>
          </div>

          <div>
            <div className={fieldClass}>
              <div className="w-full flex flex-col">
                <span className="text-neutral-600 text-[1.2rem]">
                  {t("code")}
                </span>
                <input
                  type="text"
                  className="outline-none uppercase tracking-[0.08em]"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  {...register("code")}
                  autoFocus
                />
              </div>
              <RefreshCircle
                className="cursor-pointer"
                role="button"
                aria-label={t("generate")}
                onClick={() =>
                  setValue("code", generateDiscountCode(event.eventName), {
                    shouldValidate: true,
                  })
                }
                size="32"
                color="#FF8A65"
              />
            </div>
            <span className="text-[1.2rem] px-8 py-2 text-failure">
              {errors.code?.message}
            </span>
          </div>

          <div>
            <div className="flex items-center w-full gap-4">
              <Select
                onValueChange={(value) =>
                  setValue("type", value as "percentage" | "fixed", {
                    shouldValidate: true,
                  })
                }
                defaultValue="percentage"
              >
                <SelectTrigger className="bg-neutral-100 w-full rounded-[5rem] p-12 text-[1.5rem] leading-8 placeholder:text-neutral-600 text-deep-200 outline-none border border-transparent focus:border-primary-500">
                  <SelectValue placeholder={t("type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    className="text-[1.5rem] leading-8 border-b border-neutral-100 mb-3 pb-3"
                    value="fixed"
                  >
                    {t("fixed")}
                  </SelectItem>
                  <SelectItem
                    className="text-[1.5rem] leading-8 border-b border-neutral-100 mb-3 pb-3"
                    value="percentage"
                  >
                    {t("percentage")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="w-full bg-neutral-100 rounded-[5rem] px-8 py-4 flex items-center gap-2 border border-transparent focus-within:border-primary-500">
                <input
                  className="w-full bg-transparent text-[1.5rem] leading-8 placeholder:text-neutral-600 text-deep-200 outline-none"
                  type="number"
                  min={1}
                  max={type === "percentage" ? MAX_PERCENTAGE : undefined}
                  {...register("value")}
                  placeholder={t("value")}
                />
                {/* The unit, so "50" is never ambiguous between half off and
                    fifty gourdes. */}
                <span className="text-[1.4rem] text-neutral-600 shrink-0">
                  {type === "percentage" ? "%" : event.currency}
                </span>
              </div>
            </div>
            <span className="text-[1.2rem] px-8 py-2 text-failure">
              {errors.value?.message ?? errors.type?.message}
            </span>
          </div>

          <div>
            <div className={fieldClass}>
              <div className="w-full">
                <span className="text-neutral-600 text-[1.2rem]">
                  {t("expires_in")}
                </span>
                <input
                  type="number"
                  min={1}
                  max={730}
                  defaultValue={1}
                  className="w-full outline-none"
                  {...register("expiresIn")}
                />
              </div>
              <span className="text-[1.5rem] leading-8 text-neutral-600">
                {t("days")}
              </span>
            </div>
            <span className="text-[1.2rem] px-8 py-2 text-failure">
              {errors.expiresIn?.message}
            </span>
          </div>

          <Input
            type="number"
            {...register("usageLimit")}
            min={1}
            defaultValue={1}
            error={errors.usageLimit?.message}
          >
            {t("quantity")}
          </Input>

          {/* Both optional, and both new. Left blank they mean "no limit",
              which is how every code created before them behaves. */}
          <Input
            type="number"
            {...register("perUserLimit")}
            min={1}
            error={errors.perUserLimit?.message}
          >
            {t("per_user_limit")}
          </Input>

          <Input
            type="number"
            {...register("minPurchase")}
            min={0}
            error={errors.minPurchase?.message}
          >
            {`${t("min_purchase")} (${event.currency})`}
          </Input>
        </div>
      </div>

      <DrawerFooter>
        <div className="flex gap-8">
          <DrawerClose className="flex-1 cursor-pointer">
            <div className="w-full border-primary-500 text-primary-500 bg-primary-100 px-[3rem] py-[15px] border-2 rounded-[100px] text-center font-medium text-[1.5rem] h-auto leading-8 cursor-pointer transition-all duration-400 flex items-center justify-center">
              {t("close")}
            </div>
          </DrawerClose>
          <ButtonPrimary
            onClick={handleSubmit(submitHandler)}
            className="flex-1"
          >
            {isSubmitting ? <LoadingCircleSmall /> : t("add")}
          </ButtonPrimary>
        </div>
      </DrawerFooter>
    </DrawerContent>
  );
}
