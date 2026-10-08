"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "motion/react";
import { DateTime } from "luxon";
import { toast } from "sonner";
import {
  CloseCircle,
  MoreCircle,
  TicketDiscount,
  TickCircle,
  Trash,
} from "iconsax-reactjs";
import { DiscountCode } from "@ticketwaze/typescript-config";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ButtonPill } from "@/components/shared/buttons";
import { usePathname } from "@/i18n/navigation";
import {
  DeleteDiscountCode,
  SetDiscountCodeActive,
} from "@/actions/DiscountCodeActions";
import { cn } from "@/lib/utils";

export type CodeState = "live" | "scheduled" | "expired" | "exhausted" | "off";

/**
 * Where a code stands right now. Expired and used-up are not the same as
 * switched off: one ran out on its own, the other the organiser turned off.
 */
export function codeState(code: DiscountCode, now = Date.now()): CodeState {
  if (!code.isActive) return "off";
  if (new Date(code.expiresAt).getTime() <= now) return "expired";
  if (
    code.usageLimit !== null &&
    Number(code.usageCount) >= Number(code.usageLimit)
  )
    return "exhausted";
  if (code.startsAt && new Date(code.startsAt).getTime() > now)
    return "scheduled";
  return "live";
}

const STATE_COLOURS: Record<CodeState, string> = {
  live: "#349C2E",
  scheduled: "#1C7EEA",
  expired: "#737C8A",
  exhausted: "#737C8A",
  off: "#DE0028",
};

const headClass =
  "font-sans font-bold text-[1.1rem] leading-6 text-deep-100 uppercase text-left pb-6 pr-4 whitespace-nowrap";
const cellClass =
  "font-sans text-[1.5rem] leading-8 text-neutral-900 py-6 pr-4";

/**
 * The codes of one tab: code, value, classes, uses, validity and status, with
 * a ⋯ per row (activate / deactivate, delete). Phones keep the code (value
 * under it), the status and the menu.
 */
export default function DiscountCodeTable({
  activityId,
  codes,
  currency,
  timezone,
  emptyMessage,
  onAdd,
}: {
  activityId: string;
  codes: DiscountCode[];
  currency: string;
  timezone?: string;
  emptyMessage: string;
  /** Shown as a button in the empty state. */
  onAdd?: () => void;
}) {
  const t = useTranslations("Events.single_event.discount");
  const locale = useLocale();
  const pathname = usePathname();
  const [busyId, setBusyId] = useState<string | null>(null);

  const day = (value: Date | string) =>
    DateTime.fromJSDate(new Date(value))
      .setZone(timezone ?? "local")
      .setLocale(locale)
      .toLocaleString({ day: "numeric", month: "short" });
  const valueOf = (code: DiscountCode) =>
    code.type === "percentage"
      ? `${code.value}%`
      : `${Number(code.value).toLocaleString(locale)} ${code.currency ?? currency}`;
  const stateLabel: Record<CodeState, string> = {
    live: t("live"),
    scheduled: t("scheduled"),
    expired: t("expired"),
    exhausted: t("limit_reached"),
    off: t("off"),
  };

  async function setActive(code: DiscountCode, isActive: boolean) {
    setBusyId(code.discountCodeId);
    const result = await SetDiscountCodeActive(
      activityId,
      code.discountCodeId,
      isActive,
      pathname,
      locale,
    );
    setBusyId(null);
    if (result.error) return toast.error(result.error);
    toast.success(isActive ? t("activated") : t("deactivated"));
  }

  async function remove(code: DiscountCode) {
    setBusyId(code.discountCodeId);
    const result = await DeleteDiscountCode(
      activityId,
      code.discountCodeId,
      pathname,
      locale,
    );
    setBusyId(null);
    if (result.error) return toast.error(result.error);
    // A used code is deactivated rather than deleted — its redemptions priced
    // real orders. The API says which happened.
    toast.success(
      result.deleted ? t("deleted") : (result.message ?? t("deactivated")),
    );
  }

  if (codes.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center gap-8 py-16 text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <motion.div
          className="w-[11rem] h-[11rem] rounded-full flex items-center justify-center bg-neutral-100"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
        >
          <TicketDiscount
            size="44"
            color="#0d0d0d"
            variant="Bulk"
            aria-hidden
          />
        </motion.div>
        <p className="font-sans text-[1.6rem] leading-[2.4rem] text-neutral-600 max-w-[40rem]">
          {emptyMessage}
        </p>
        {onAdd && (
          <ButtonPill
            tone="primary"
            onClick={onAdd}
            className="px-10 py-[1.1rem] text-[1.5rem]"
          >
            {t("title")}
          </ButtonPill>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <table className="w-full table-fixed">
        <thead>
          <tr className="border-b border-neutral-100">
            <th className={headClass}>{t("code")}</th>
            <th className={cn(headClass, "hidden lg:table-cell")}>
              {t("value")}
            </th>
            <th className={cn(headClass, "hidden lg:table-cell")}>
              {t("col_applies")}
            </th>
            <th className={cn(headClass, "hidden lg:table-cell")}>
              {t("col_used")}
            </th>
            <th className={cn(headClass, "hidden lg:table-cell")}>
              {t("col_window")}
            </th>
            <th className={cn(headClass, "w-[12rem] lg:w-[14rem]")}>
              {t("col_status")}
            </th>
            <th className="w-[4rem]" aria-hidden />
          </tr>
        </thead>
        <tbody>
          {codes.map((code, i) => {
            const state = codeState(code);
            const dim = state === "expired" || state === "exhausted";
            return (
              <motion.tr
                key={code.discountCodeId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.24) }}
                className={cn(
                  "border-b border-neutral-100",
                  dim && "text-neutral-500",
                )}
              >
                <td className={cellClass}>
                  <span
                    className={cn(
                      "block font-semibold tracking-[0.04em] truncate",
                      dim && "text-neutral-500",
                    )}
                  >
                    {code.code}
                  </span>
                  <span className="lg:hidden block text-[1.3rem] text-neutral-600">
                    {valueOf(code)}
                  </span>
                </td>
                <td
                  className={cn(
                    cellClass,
                    "hidden lg:table-cell font-medium whitespace-nowrap",
                  )}
                >
                  {valueOf(code)}
                </td>
                <td className={cn(cellClass, "hidden lg:table-cell")}>
                  {code.appliesTo && code.appliesTo.length > 0 ? (
                    <span className="flex flex-wrap gap-1">
                      {code.appliesTo.map((name) => (
                        <span
                          key={name}
                          className="inline-block px-2 py-[.3rem] rounded-[3rem] bg-[#f5f5f5] font-bold text-[1.1rem] leading-6 uppercase text-deep-100"
                        >
                          {name}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="text-neutral-600">{t("all_classes")}</span>
                  )}
                </td>
                <td
                  className={cn(
                    cellClass,
                    "hidden lg:table-cell whitespace-nowrap",
                  )}
                >
                  {code.usageCount}
                  <span className="text-neutral-500"> / {code.usageLimit}</span>
                </td>
                <td
                  className={cn(
                    cellClass,
                    "hidden lg:table-cell whitespace-nowrap",
                  )}
                >
                  {code.startsAt ? `${day(code.startsAt)} – ` : ""}
                  {day(code.expiresAt)}
                </td>
                <td className={cellClass}>
                  <motion.span
                    key={state}
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-block px-2 py-[.3rem] rounded-[3rem] bg-[#f5f5f5] font-bold text-[1.1rem] leading-6 uppercase"
                    style={{ color: STATE_COLOURS[state] }}
                  >
                    {stateLabel[state]}
                  </motion.span>
                </td>
                <td className="py-6 text-right">
                  <Popover>
                    <PopoverTrigger
                      aria-label={t("actions")}
                      disabled={busyId === code.discountCodeId}
                      className="w-[2.4rem] h-[2.4rem] rounded-full bg-neutral-100 inline-flex items-center justify-center cursor-pointer hover:bg-neutral-200 disabled:opacity-50"
                    >
                      <MoreCircle
                        size="16"
                        variant="Bulk"
                        color="#737C8A"
                        aria-hidden
                      />
                    </PopoverTrigger>
                    <PopoverContent
                      align="end"
                      className="w-[23.5rem] p-[1rem] bg-neutral-100 border border-neutral-200 rounded-[1rem] shadow-[0px_10px_30px_rgba(0,0,0,0.12)]"
                    >
                      <p className="font-sans font-medium pb-2 border-b border-neutral-200 text-[1.4rem] text-deep-100 leading-8">
                        {t("actions")}
                      </p>
                      <button
                        type="button"
                        onClick={() => setActive(code, !code.isActive)}
                        className="w-full flex items-center justify-between gap-6 py-4 border-b border-neutral-200 font-sans text-[1.5rem] leading-8 text-neutral-700 cursor-pointer hover:text-primary-500"
                      >
                        {code.isActive ? t("deactivate") : t("activate")}
                        {code.isActive ? (
                          <CloseCircle
                            size="20"
                            variant="Bulk"
                            color="#2E3237"
                          />
                        ) : (
                          <TickCircle
                            size="20"
                            variant="Bulk"
                            color="#349C2E"
                          />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(code)}
                        className="w-full flex items-center justify-between gap-6 py-4 font-sans text-[1.5rem] leading-8 text-failure cursor-pointer"
                      >
                        {t("delete")}
                        <Trash size="20" variant="Bulk" color="#DE0028" />
                      </button>
                    </PopoverContent>
                  </Popover>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </motion.div>
  );
}
