// forms/CreateInPersonEvent.schema.ts

import z from "zod";
import type { TranslateFn } from "./types";

/**
 * Schema factory function.
 * - Accepts `t` translation function (same style as useTranslations).
 * - Accepts `freeTicketLimit`, the plan's allowance of give-away seats. It is a
 *   single budget shared across every free tier — see `superRefine`.
 * - Accepts `imageOptional` for publishing a teaser, which already has a cover
 *   image on the server; uploading again is then a replacement, not a
 *   requirement.
 *
 * It used to take an activity-wide `isFree` to decide whether a price was
 * required. It no longer can: a Pro organisation may price each tier
 * separately, so that question is now answered per tier by the tier's own
 * `isFree` flag, and the factory no longer has to be rebuilt when the toggle
 * moves.
 */
export function makeCreateInPersonSchema(
  t: TranslateFn,
  freeTicketLimit: number,
  imageOptional = false,
) {
  const imageSchema = z
    .file({
      error: (issue) =>
        issue.input === undefined
          ? t("errors.basicDetails.image.required")
          : t("errors.basicDetails.image.required"),
    })
    .mime(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

  return z.object({
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
    address: z.string().min(1, t("errors.basicDetails.address")),
    state: z.string().min(1, t("errors.basicDetails.state")),
    city: z.string().min(1, t("errors.basicDetails.city")),
    country: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? t("errors.basicDetails.country")
            : t("errors.basicDetails.country"),
      })
      .min(1, t("errors.basicDetails.country")),
    location: z
      .object({
        lat: z
          .number({ error: t("errors.basicDetails.longitude") })
          .min(-90, { error: t("errors.basicDetails.longitude") })
          .max(90, { error: t("errors.basicDetails.longitude") }),
        lng: z.number().min(-180).max(180),
      })
      .refine((val) => val !== undefined, {
        message: t("errors.basicDetails.longitude"),
      }),
    activityTags: z.array(z.string()).min(1, t("errors.basicDetails.tags")),
    // Always optional at the field level so the factory infers one stable
    // type; when an image is actually required, `superRefine` below enforces
    // it. Branching the field itself would make `z.infer` a union and every
    // consumer of it handle both halves.
    eventImage: imageSchema.optional(),
    eventDays: z.array(
      z
        .object({
          dayNumber: z.number().int().min(1),

          // Keep as plain date string — never convert to Date object
          eventDate: z
            .string()
            .min(1, t("errors.dateAndTime.eventDate"))
            .regex(/^\d{4}-\d{2}-\d{2}$/, t("errors.dateAndTime.invalidDate")),

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
        // Required-ness is per TIER, not per activity: a Pro organisation can
        // put a free tier beside a paid one, so `isFree` on the whole activity
        // no longer answers "must this field be filled in?". Checked in
        // `superRefine` below, where the sibling `isFree` flag is readable.
        ticketTypePrice: z.string(),
        ticketTypeQuantity: z
          .string()
          .min(1, t("errors.ticketClass.quantity.empty"))
          .refine((val) => /^[1-9]\d*$/.test(val), {
            message: t("errors.ticketClass.quantity.decimal"),
          }),
        isFree: z.boolean(),
      }),
    ),
    eventCurrency: z.string(),
    isFree: z.boolean(),
    absorbFees: z.boolean(),
    // Optional cutoff after which tickets can no longer be bought. The event
    // stays listed; it is simply shown as "sales ended". Empty = no cutoff.
    ticketSalesEndAt: z.string().optional(),
  }).superRefine((data, ctx) => {
    // Creating an event needs a cover image. Publishing a teaser does not: it
    // already has one, and leaving the field alone keeps it.
    if (!imageOptional && !data.eventImage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t("errors.basicDetails.image.required"),
        path: ["eventImage"],
      });
    }
    /**
     * The plan's free-seat allowance is ONE budget shared by every free tier,
     * not a ceiling each tier gets to itself — otherwise two "free" tiers of
     * 300 would give away 600 on a plan that allows 300. Mirrors
     * `checkTicketTierPolicy` in the API, which is what actually enforces it.
     *
     * The error is attached to the last free tier's quantity field so it lands
     * somewhere the organiser can see and act on.
     */
    const freeTiers = data.ticketTypes
      .map((ticket, index) => ({ ticket, index }))
      .filter(({ ticket }) => ticket.isFree);

    if (freeTiers.length > 0) {
      const freeQuantity = freeTiers.reduce((total, { ticket }) => {
        const quantity = parseInt(ticket.ticketTypeQuantity, 10);
        return total + (isNaN(quantity) ? 0 : quantity);
      }, 0);
      if (freeQuantity > freeTicketLimit) {
        const last = freeTiers[freeTiers.length - 1]!;
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("errors.ticketClass.quantity.exceedsLimit", {
            limit: freeTicketLimit,
          }),
          path: ["ticketTypes", last.index, "ticketTypeQuantity"],
        });
      }
    }

    const isHTG = data.eventCurrency === "HTG";
    const isUSD = data.eventCurrency === "USD";
    data.ticketTypes.forEach((ticket, index) => {
      // A free tier has no price to check, and no price to demand.
      if (ticket.isFree) return;

      if (ticket.ticketTypePrice.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("errors.ticketClass.price"),
          path: ["ticketTypes", index, "ticketTypePrice"],
        });
        return;
      }

      const price = parseFloat(ticket.ticketTypePrice);
      if (isHTG && (!isNaN(price) && price < 100)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("errors.ticketClass.priceMinHTG"),
          path: ["ticketTypes", index, "ticketTypePrice"],
        });
      } else if (isUSD && (!isNaN(price) && price < 5)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("errors.ticketClass.priceMinUSD"),
          path: ["ticketTypes", index, "ticketTypePrice"],
        });
      }
    });
  });
}
