"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  CloseCircle,
  MoreCircle,
  Trash,
  TickCircle,
} from "iconsax-reactjs";
import { DiscountCode } from "@ticketwaze/typescript-config";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Capitalize from "@/lib/Capitalize";
import { usePathname } from "@/i18n/navigation";
import {
  DeleteDiscountCode,
  SetDiscountCodeActive,
} from "@/actions/DiscountCodeActions";

/**
 * ONE TABLE, WHERE THERE WERE THREE.
 *
 * The all / active / inactive tabs each had their own full copy of this markup
 * — the same seven columns, the same row renderer, the same popover — in a
 * 1,121-line file. Three copies of a table is three places to fix a column and
 * two places to forget, and the tabs differ by exactly one predicate.
 */
export default function DiscountCodeTable({
  activityId,
  codes,
  currency,
  emptyMessage,
}: {
  activityId: string;
  codes: DiscountCode[];
  currency: string;
  emptyMessage: string;
}) {
  const t = useTranslations("Events.single_event.discount");
  const locale = useLocale();
  const pathname = usePathname();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (codes.length === 0) {
    return (
      <div className="flex items-center justify-center py-[6rem]">
        <span className="text-[1.5rem] text-neutral-600">{emptyMessage}</span>
      </div>
    );
  }

  async function setActive(discountCodeId: string, isActive: boolean) {
    setBusyId(discountCodeId);
    const result = await SetDiscountCodeActive(
      activityId,
      discountCodeId,
      isActive,
      pathname,
      locale,
    );
    setBusyId(null);
    if (result.error) return toast.error(result.error);
    toast.success(isActive ? t("activated") : t("deactivated"));
  }

  async function remove(discountCodeId: string) {
    setBusyId(discountCodeId);
    const result = await DeleteDiscountCode(
      activityId,
      discountCodeId,
      pathname,
      locale,
    );
    setBusyId(null);
    if (result.error) return toast.error(result.error);
    /**
     * A code that has been used is deactivated rather than deleted — its
     * redemptions are part of how past orders were priced. The API says which
     * happened, and the organiser is told rather than left to wonder why the
     * row is still there.
     */
    toast.success(result.deleted ? t("deleted") : (result.message ?? t("deactivated")));
  }

  const headClass =
    "font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase";
  const cellClass = "text-[1.5rem] py-[15px] leading-8 text-neutral-900";

  return (
    <Table className="mt-4">
      <TableHeader>
        <TableRow>
          <TableHead className={headClass}>{t("code")}</TableHead>
          <TableHead className={`hidden lg:table-cell ${headClass}`}>
            {t("type")}
          </TableHead>
          <TableHead className={headClass}>{t("value")}</TableHead>
          <TableHead className={headClass}>{t("times_used")}</TableHead>
          <TableHead className={`hidden lg:table-cell ${headClass}`}>
            {t("quantity")}
          </TableHead>
          <TableHead className={`hidden lg:table-cell ${headClass}`}>
            {t("expires_at")}
          </TableHead>
          <TableHead className={headClass} />
        </TableRow>
      </TableHeader>
      <TableBody>
        {codes.map((code) => {
          const expires = new Date(code.expiresAt);
          /**
           * EXPIRED IS NOT THE SAME AS INACTIVE, and the organiser needs to
           * see the difference: one they turned off, the other ran out on its
           * own. An expired code is shown greyed rather than red, because
           * there is nothing to fix.
           */
          const hasExpired = expires.getTime() <= Date.now();
          const exhausted =
            code.usageLimit !== null &&
            Number(code.usageCount) >= Number(code.usageLimit);
          const live = code.isActive && !hasExpired && !exhausted;

          const tone = live
            ? "text-success"
            : hasExpired || exhausted
              ? "text-neutral-500"
              : "text-failure";

          return (
            <TableRow key={code.discountCodeId}>
              <TableCell className={cellClass}>
                <div className="flex flex-col">
                  <span className={tone}>{code.code}</span>
                  {(hasExpired || exhausted) && (
                    <span className="text-[1.1rem] text-neutral-500 uppercase tracking-[0.04em]">
                      {hasExpired ? t("expired") : t("limit_reached")}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className={`hidden lg:table-cell ${cellClass}`}>
                <span className={tone}>{Capitalize(code.type)}</span>
              </TableCell>
              <TableCell className={cellClass}>
                <span className={tone}>
                  {code.type === "percentage"
                    ? `${code.value}%`
                    : `${code.value} ${code.currency ?? currency}`}
                </span>
              </TableCell>
              <TableCell className={cellClass}>
                <span className={tone}>{code.usageCount}</span>
              </TableCell>
              <TableCell className={`hidden lg:table-cell ${cellClass}`}>
                <span className={tone}>{code.usageLimit}</span>
              </TableCell>
              <TableCell className={`hidden lg:table-cell ${cellClass}`}>
                <span className={tone}>
                  {expires.toLocaleDateString(locale, {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </TableCell>
              <TableCell className={cellClass}>
                <Popover>
                  <PopoverTrigger
                    disabled={busyId === code.discountCodeId}
                    className="cursor-pointer disabled:opacity-50"
                    aria-label={t("actions")}
                  >
                    <MoreCircle size="24" color="#0d0d0d" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4 flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setActive(code.discountCodeId, !code.isActive)
                      }
                      className="flex items-center gap-3 text-[1.4rem] text-deep-100 cursor-pointer"
                    >
                      {code.isActive ? (
                        <>
                          <CloseCircle size="18" color="#d92d20" />
                          {t("deactivate")}
                        </>
                      ) : (
                        <>
                          <TickCircle size="18" color="#1F9D55" />
                          {t("activate")}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(code.discountCodeId)}
                      className="flex items-center gap-3 text-[1.4rem] text-failure cursor-pointer"
                    >
                      <Trash size="18" color="#d92d20" />
                      {t("delete")}
                    </button>
                  </PopoverContent>
                </Popover>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
