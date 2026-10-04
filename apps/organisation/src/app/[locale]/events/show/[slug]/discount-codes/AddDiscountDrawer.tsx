"use client";
import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AnimatePresence, motion } from "motion/react";
import { DateTime } from "luxon";
import { toast } from "sonner";
import {
  ArrowDown2,
  MinusCirlce,
  RefreshCircle,
  TickSquare,
  Warning2,
} from "iconsax-reactjs";
import { Event } from "@ticketwaze/typescript-config";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PickerField, pillClass } from "@/components/create/FormFields";
import { AuthStatus } from "@/components/auth/AuthParts";
import SuccessBadge from "@/assets/images/auth/success-badge.png";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Stagger } from "@/components/shared/motion";
import { usePathname } from "@/i18n/navigation";
import { generateDiscountCode } from "@/lib/GenerateDiscountCode";
import { eventStartsAt } from "@/lib/eventTime";
import { CreateDiscountCode } from "@/actions/DiscountCodeActions";
import { cn } from "@/lib/utils";

const MAX_PERCENTAGE = 100;

/**
 * Figma's "Add Discount Code" panel (1777:50717 / 1779:51558, success
 * 1780:52423; phone 2222:59720 / 60364 / 62299): Code, Type + Value, Applies
 * to, Quantity, Start and End date, then the success screen with Share. The
 * post-design options (uses per buyer, minimum order, notify followers) sit
 * under "More options"; the generate button stays in the code field.
 */
export default function AddDiscountDrawer({
  event,
  open,
  onOpenChange,
  onShare,
}: {
  event: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Success screen › Share, with the new code (already copied). */
  onShare: (code: string) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="bg-white border-none outline-none my-6 mr-4 lg:mr-6 p-6 lg:p-12 rounded-[30px] data-[vaul-drawer-direction=right]:w-[calc(100vw-2rem)] data-[vaul-drawer-direction=right]:lg:w-[58rem]">
        {/* Remounted on every open, so the form starts clean each time. */}
        {open && (
          <DiscountForm
            event={event}
            onClose={() => onOpenChange(false)}
            onShare={onShare}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}

function DiscountForm({
  event,
  onClose,
  onShare,
}: {
  event: Event;
  onClose: () => void;
  onShare: (code: string) => void;
}) {
  const t = useTranslations("Events.single_event.discount");
  const locale = useLocale();
  const pathname = usePathname();
  const [created, setCreated] = useState<{
    code: string;
    startsOn: string;
  } | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  const zone = event.eventDays[0]?.timezone ?? "America/Port-au-Prince";
  const today = DateTime.now().setZone(zone).toISODate()!;
  const eventDay = eventStartsAt(event.eventDays)?.setZone(zone).toISODate();
  const classes = event.eventTicketTypes.map((c) => c.ticketTypeName);

  const schema = z
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
        .refine((v) => Number(v) >= 1, { error: t("errors.value.negative") }),
      appliesTo: z.array(z.string()),
      usageLimit: z
        .string()
        .min(1, { error: t("errors.quantity.min") })
        .refine((v) => Number(v) >= 1, {
          error: t("errors.quantity.negative"),
        }),
      startsOn: z.string(),
      endsOn: z.string().min(1, { error: t("errors.end.required") }),
      perUserLimit: z.string().optional(),
      minPurchase: z.string().optional(),
      notifyFollowers: z.boolean(),
    })
    .refine(
      (d) => d.type !== "percentage" || Number(d.value) <= MAX_PERCENTAGE,
      {
        path: ["value"],
        error: t("errors.value.percentage"),
      },
    )
    .refine((d) => !d.endsOn || d.endsOn >= today, {
      path: ["endsOn"],
      error: t("errors.end.past"),
    })
    .refine((d) => !d.endsOn || !d.startsOn || d.endsOn >= d.startsOn, {
      path: ["endsOn"],
      error: t("errors.end.before"),
    });
  type Values = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "",
      type: "percentage",
      value: "",
      appliesTo: [],
      usageLimit: "",
      startsOn: today,
      endsOn: eventDay && eventDay >= today ? eventDay : "",
      notifyFollowers: false,
    },
  });
  const type = useWatch({ control, name: "type" });
  const appliesTo = useWatch({ control, name: "appliesTo" });
  const notifyFollowers = useWatch({ control, name: "notifyFollowers" });

  async function submit(data: Values) {
    const code = data.code.toUpperCase();
    const result = await CreateDiscountCode(
      event.eventId,
      {
        code,
        type: data.type,
        value: Number(data.value),
        usageLimit: Number(data.usageLimit),
        startsOn: data.startsOn || null,
        endsOn: data.endsOn,
        appliesTo: data.appliesTo.length > 0 ? data.appliesTo : null,
        ...(data.perUserLimit
          ? { perUserLimit: Number(data.perUserLimit) }
          : {}),
        ...(data.minPurchase ? { minPurchase: Number(data.minPurchase) } : {}),
        notifyFollowers: data.notifyFollowers,
      },
      pathname,
      locale,
    );
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setCreated({ code, startsOn: data.startsOn });
  }

  const titleEl = (
    <DrawerTitle className="font-primary font-medium text-center text-[2.2rem] lg:text-[2.6rem] leading-12 text-black pb-6 lg:pb-8 shrink-0">
      {t("title")}
    </DrawerTitle>
  );
  const ghostButton =
    "w-full lg:flex-1 h-[5rem] shrink-0 rounded-[10rem] border-2 border-primary-500 bg-primary-50 font-sans font-semibold text-[1.5rem] text-primary-500 cursor-pointer transition-colors hover:bg-primary-100";
  const primaryButton =
    "w-full lg:flex-1 h-[5rem] shrink-0 rounded-[10rem] bg-primary-500 font-sans font-semibold text-[1.5rem] text-white cursor-pointer transition-colors hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";

  /* ── Success (Figma 1780:52423) ── */
  if (created) {
    const scheduled = created.startsOn > today;
    return (
      <>
        {titleEl}
        <DrawerDescription className="sr-only">
          {t("success_title")}
        </DrawerDescription>
        <div className="flex-1 min-h-0 overflow-y-auto flex items-center justify-center py-10">
          <div className="max-w-[40rem]">
            <AuthStatus
              image={SuccessBadge}
              title={t("success_title")}
              description={
                scheduled
                  ? t("success_description_scheduled", {
                      date: DateTime.fromISO(created.startsOn)
                        .setLocale(locale)
                        .toLocaleString(DateTime.DATE_MED),
                    })
                  : t("success_description")
              }
            />
          </div>
        </div>
        <div className="shrink-0 flex flex-col-reverse lg:flex-row gap-4 lg:gap-6">
          <button type="button" onClick={onClose} className={ghostButton}>
            {t("back_to_event")}
          </button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => onShare(created.code)}
            className={primaryButton}
          >
            {t("share")}
          </motion.button>
        </div>
      </>
    );
  }

  /* ── Form ── */
  const fieldError = (message?: string) =>
    message ? (
      <span className="block text-[1.2rem] px-8 pt-2 text-failure">
        {message}
      </span>
    ) : null;
  const numberPill =
    "bg-neutral-100 w-full rounded-[5rem] h-[6rem] px-8 text-[1.5rem] outline-none border border-transparent focus:border-primary-500 placeholder:text-neutral-600";

  return (
    <>
      {titleEl}
      <DrawerDescription className="sr-only">
        {t("page_title")}
      </DrawerDescription>
      <form
        id="add-discount"
        onSubmit={handleSubmit(submit)}
        noValidate
        // A wheel over a focused number field scrolls the form, not the value.
        onWheel={(e) => {
          const el = e.target as HTMLInputElement;
          if (el.type === "number" && document.activeElement === el) el.blur();
        }}
        className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-6 pb-6"
      >
        <Stagger step={0.04}>
          {/* Code + generate */}
          <div>
            <div className={pillClass}>
              <input
                type="text"
                placeholder={t("code")}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                className="flex-1 min-w-0 bg-transparent outline-none uppercase tracking-[0.06em] text-[1.5rem] text-deep-200 placeholder:normal-case placeholder:tracking-normal placeholder:text-neutral-600"
                {...register("code")}
              />
              <button
                type="button"
                aria-label={t("generate")}
                title={t("generate")}
                className="shrink-0 cursor-pointer transition-transform hover:rotate-90"
                onClick={() =>
                  setValue("code", generateDiscountCode(event.eventName), {
                    shouldValidate: true,
                  })
                }
              >
                <RefreshCircle size="24" variant="Bulk" color="#E45B00" />
              </button>
            </div>
            {fieldError(errors.code?.message)}
          </div>

          {/* Type + Value */}
          <div>
            <div className="flex gap-4">
              <Select
                value={type}
                onValueChange={(v) =>
                  setValue("type", v as Values["type"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="flex-1 bg-neutral-100 rounded-[5rem] !h-[6rem] px-8 text-[1.5rem] text-deep-200 border border-transparent focus:border-primary-500 shadow-none">
                  <SelectValue placeholder={t("type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="text-[1.5rem] py-3" value="percentage">
                    {t("percentage")}
                  </SelectItem>
                  <SelectItem className="text-[1.5rem] py-3" value="fixed">
                    {t("fixed")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <label className="flex-1 bg-neutral-100 rounded-[5rem] h-[6rem] px-8 flex items-center gap-2 border border-transparent focus-within:border-primary-500">
                <input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  max={type === "percentage" ? MAX_PERCENTAGE : undefined}
                  placeholder={t("value")}
                  className="flex-1 min-w-0 bg-transparent outline-none text-[1.5rem] text-deep-200 placeholder:text-neutral-600"
                  {...register("value")}
                />
                <span className="text-[1.4rem] font-medium text-deep-100 shrink-0">
                  {type === "percentage" ? "%" : event.currency}
                </span>
              </label>
            </div>
            {fieldError(errors.value?.message)}
          </div>

          {/* Applies to (only when there is a choice) */}
          {classes.length > 1 && (
            <AppliesToField
              classes={classes}
              value={appliesTo}
              onChange={(next) => setValue("appliesTo", next)}
            />
          )}

          {/* Quantity */}
          <div>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              placeholder={t("quantity")}
              className={numberPill}
              {...register("usageLimit")}
            />
            {fieldError(errors.usageLimit?.message)}
          </div>

          {/* Start + End */}
          <div className="flex flex-col lg:flex-row gap-4">
            <PickerField
              label={t("start")}
              type="date"
              inputProps={{ ...register("startsOn"), min: today }}
            />
            <PickerField
              label={t("end")}
              type="date"
              inputProps={{ ...register("endsOn"), min: today }}
              error={errors.endsOn?.message}
            />
          </div>

          {/* More options (post-design) */}
          <div className="flex flex-col">
            <button
              type="button"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((o) => !o)}
              className="flex items-center gap-2 px-4 py-2 text-[1.4rem] font-medium text-primary-500 cursor-pointer w-fit"
            >
              {t("more_options")}
              <motion.span
                animate={{ rotate: moreOpen ? 180 : 0 }}
                className="flex"
              >
                <ArrowDown2 size="16" color="#E45B00" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {moreOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-4 pt-4">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      placeholder={t("per_user_limit")}
                      className={numberPill}
                      {...register("perUserLimit")}
                    />
                    <label className="bg-neutral-100 w-full rounded-[5rem] h-[6rem] px-8 flex items-center gap-2 border border-transparent focus-within:border-primary-500">
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        placeholder={t("min_purchase")}
                        className="flex-1 min-w-0 bg-transparent outline-none text-[1.5rem] text-deep-200 placeholder:text-neutral-600"
                        {...register("minPurchase")}
                      />
                      <span className="text-[1.4rem] font-medium text-deep-100">
                        {event.currency}
                      </span>
                    </label>
                    <label className="flex items-start gap-4 rounded-[2rem] bg-neutral-100 px-8 py-6 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-[3px] size-[1.8rem] accent-primary-500 cursor-pointer"
                        checked={notifyFollowers}
                        onChange={(e) =>
                          setValue("notifyFollowers", e.target.checked)
                        }
                      />
                      <span className="flex flex-col gap-1">
                        <span className="text-[1.5rem] leading-8 text-deep-200">
                          {t("notify_followers")}
                        </span>
                        <span className="text-[1.3rem] leading-6 text-neutral-600">
                          {t("notify_followers_description")}
                        </span>
                      </span>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Who pays for it, said before committing. */}
          <p className="flex items-start gap-3 px-4 text-[1.2rem] leading-6 text-neutral-600">
            <Warning2
              size="16"
              variant="Bulk"
              color="#EA961C"
              className="shrink-0 mt-[.1rem]"
              aria-hidden
            />
            {t("cost_notice")}
          </p>
        </Stagger>
      </form>

      {/* Desktop: Close | Add. Phone: Add on top (2222:59720). */}
      <div className="shrink-0 mt-4 flex flex-col-reverse lg:flex-row gap-4 lg:gap-6">
        <button type="button" onClick={onClose} className={ghostButton}>
          {t("close")}
        </button>
        <button
          type="submit"
          form="add-discount"
          disabled={isSubmitting}
          className={primaryButton}
        >
          {isSubmitting ? <LoadingCircleSmall /> : t("add")}
        </button>
      </div>
    </>
  );
}

/** "Applies to": chips of the chosen classes in a pill, the list in a popover. */
function AppliesToField({
  classes,
  value,
  onChange,
}: {
  classes: string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const t = useTranslations("Events.single_event.discount");
  const has = (name: string) => value.includes(name);
  const toggle = (name: string) =>
    onChange(has(name) ? value.filter((n) => n !== name) : [...value, name]);
  return (
    <Popover>
      <PopoverAnchor asChild>
        <div className={cn(pillClass, "pr-6")}>
          <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
            {value.length === 0 ? (
              <PopoverTrigger className="text-left text-[1.5rem] text-neutral-600 cursor-pointer flex-1">
                {t("applies")}
                <span className="text-neutral-400"> · {t("all_classes")}</span>
              </PopoverTrigger>
            ) : (
              <AnimatePresence initial={false}>
                {value.map((name) => (
                  <motion.span
                    key={name}
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="inline-flex items-center gap-2 rounded-[3rem] bg-neutral-200 pl-4 pr-2 py-1 text-[1.4rem] text-deep-100"
                  >
                    {name}
                    <button
                      type="button"
                      aria-label={t("remove_class", { name })}
                      onClick={() => toggle(name)}
                      className="flex cursor-pointer"
                    >
                      <MinusCirlce size="18" variant="Bulk" color="#737C8A" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            )}
          </div>
          <PopoverTrigger
            aria-label={t("applies")}
            className="shrink-0 flex cursor-pointer"
          >
            <ArrowDown2 size="18" color="#737C8A" variant="Bold" />
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="end"
        className="w-[var(--radix-popover-anchor-width,24rem)] min-w-[24rem] p-[1rem] bg-white border border-neutral-200 rounded-[1.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
      >
        <ul className="flex flex-col">
          {classes.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => toggle(name)}
                className="w-full flex items-center justify-between gap-4 px-4 py-3 rounded-[1rem] text-[1.5rem] text-deep-100 cursor-pointer hover:bg-neutral-100"
              >
                {name}
                <TickSquare
                  size="20"
                  variant={has(name) ? "Bold" : "Linear"}
                  color={has(name) ? "#E45B00" : "#C2C7CE"}
                />
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
