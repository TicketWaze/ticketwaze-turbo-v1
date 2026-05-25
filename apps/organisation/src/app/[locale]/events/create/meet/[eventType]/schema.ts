import z from "zod";
import type { TranslateFn } from "./types";

/**
 * Schema factory function.
 * - Accepts `isFree` so ticket price requirement can change.
 * - Accepts `t` translation function (same style as useTranslations).
 */
export function makeMeetPersonSchema(isFree: boolean, t: TranslateFn) {
  return z
    .object({
      eventName: z.string().min(10, t("errors.basicDetails.name")).max(150),
      eventDescription: z
        .string()
        .refine(
          (v) => v.replace(/<[^>]*>/g, "").trim().length >= 150,
          t("errors.basicDetails.description.min"),
        )
        .refine(
          (v) => v.replace(/<[^>]*>/g, "").trim().length <= 3000,
          t("errors.basicDetails.description.max"),
        ),
      activityTags: z.array(z.string()).min(1, t("errors.basicDetails.tags")),
      eventImage: z
        .file({
          error: (issue) =>
            issue.input === undefined
              ? t("errors.basicDetails.image.required")
              : t("errors.basicDetails.image.required"),
        })
        .mime(["image/jpeg", "image/jpg", "image/png", "image/webp"]),
      eventDays: z.array(
        z
          .object({
            dayNumber: z.number().int().min(1),

            // Keep as plain date string — never convert to Date object
            eventDate: z
              .string()
              .min(1, t("errors.dateAndTime.eventDate"))
              .regex(
                /^\d{4}-\d{2}-\d{2}$/,
                t("errors.dateAndTime.invalidDate"),
              ),

            // Keep as plain time string — never convert to Date object
            startTime: z
              .string()
              .min(1, t("errors.dateAndTime.startTime"))
              .regex(
                /^\d{2}:\d{2}(:\d{2})?$/,
                t("errors.dateAndTime.invalidTime"),
              ),

            endTime: z
              .string()
              .min(1, t("errors.dateAndTime.endTime"))
              .regex(
                /^\d{2}:\d{2}(:\d{2})?$/,
                t("errors.dateAndTime.invalidTime"),
              ),

            timezone: z
              .string()
              .min(1, t("errors.dateAndTime.timezone"))
              .refine(
                (tz) => {
                  try {
                    Intl.DateTimeFormat(undefined, { timeZone: tz });
                    return true;
                  } catch {
                    return false;
                  }
                },
                { message: t("errors.dateAndTime.invalidTimezone") },
              ),
          })
          .refine((day) => day.startTime < day.endTime, {
            message: t("errors.dateAndTime.endBeforeStart"),
            path: ["endTime"],
          }),
      ),
      ticketTypes: z.array(
        z.object({
          ticketTypeName: z.string().min(3, t("errors.ticketClass.name")),
          ticketTypeDescription: z
            .string()
            .min(20, t("errors.ticketClass.description"))
            .max(150),
          ticketTypePrice: isFree
            ? z.string()
            : z.string().min(1, t("errors.ticketClass.price")),
          ticketTypeQuantity: z
            .string()
            .min(1, t("errors.ticketClass.quantity.empty"))
            .refine((val) => /^[1-9]\d*$/.test(val), {
              message: t("errors.ticketClass.quantity.decimal"),
            }),
        }),
      ),
      eventCurrency: z.string(),
      isFree: z.boolean(),
    })
    .superRefine((data, ctx) => {
      if (data.isFree) return;
      const isHTG = data.eventCurrency === "HTG";
      const isUSD = data.eventCurrency === "USD";
      data.ticketTypes.forEach((ticket, index) => {
        const price = parseFloat(ticket.ticketTypePrice);
        if (isHTG && !isNaN(price) && price < 250) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("errors.ticketClass.priceMinHTG"),
            path: ["ticketTypes", index, "ticketTypePrice"],
          });
        } else if (isUSD && !isNaN(price) && price < 5) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("errors.ticketClass.priceMinUSD"),
            path: ["ticketTypes", index, "ticketTypePrice"],
          });
        }
      });
    });
}
