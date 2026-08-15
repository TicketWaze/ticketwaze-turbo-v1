import z from "zod";
import type { TranslateFn } from "./types";

/**
 * Minutes between two "HH:MM" times on the same date.
 *
 * Same date is the whole model here: an event day carries one date with a start
 * and an end, and the schema requires the end to be later, so this cannot go
 * negative or wrap past midnight.
 */
export function minutesBetween(
  startTime: string,
  endTime: string,
): number | null {
  const parse = (value: string) => {
    const [h, m] = (value ?? "").split(":").map(Number);
    return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
  };
  const start = parse(startTime);
  const end = parse(endTime);
  if (start === null || end === null) return null;
  return end - start;
}

/** Which platform hosts the call. Both have plan limits; they differ in wording. */
export type OnlineProvider = "zoom" | "google_meet";

/**
 * Refuse a first day longer than the provider's plan allows.
 *
 * Shared by the create and edit schemas so the two cannot drift, and scoped to
 * day 1 because that is the day the meeting is created from — matching the
 * server exactly. A client stricter than the server would block saves the API
 * would have accepted.
 *
 * Both providers cap meeting length by plan and neither reports it through an
 * API — Zoom's comes from the account tier, Google's from what the organiser
 * declared — so the check is identical and only the message differs.
 */
export function addMeetingDurationIssue(
  ctx: z.RefinementCtx,
  eventDays: { dayNumber: number; startTime: string; endTime: string }[],
  maxMeetingMinutes: number | null,
  t: TranslateFn,
  provider: OnlineProvider = "zoom",
) {
  if (maxMeetingMinutes === null) return;

  const firstDay = eventDays.find((day) => day.dayNumber === 1);
  if (!firstDay) return;

  const minutes = minutesBetween(firstDay.startTime, firstDay.endTime);
  if (minutes === null || minutes <= maxMeetingMinutes) return;

  const index = eventDays.indexOf(firstDay);

  /**
   * Stated in minutes below two hours, because the limit that bites here is a
   * free Google account's 60-minute group-call cap and "1 hours" would read as
   * a bug rather than as the rule it is.
   */
  const message =
    provider === "zoom"
      ? t("errors.dateAndTime.exceedsZoomDuration", {
          hours: Math.floor(maxMeetingMinutes / 60),
        })
      : maxMeetingMinutes < 120
        ? t("errors.dateAndTime.exceedsGoogleDurationMinutes", {
            minutes: maxMeetingMinutes,
          })
        : t("errors.dateAndTime.exceedsGoogleDuration", {
            hours: Math.floor(maxMeetingMinutes / 60),
          });

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message,
    path: ["eventDays", index, "endTime"],
  });
}

/**
 * Schema factory function.
 * - Accepts `isFree` so ticket price requirement can change.
 * - Accepts `t` translation function (same style as useTranslations).
 */
export function makeMeetPersonSchema(
  isFree: boolean,
  t: TranslateFn,
  freeTicketLimit: number,
  /**
   * Seats on the plan hosting the call, or null when it is not known.
   *
   * Checked here as well as by the API because the API's refusal arrives only
   * on submit, three steps in. The API is still the authority — this exists so
   * the organiser is told before they have filled in a form they must redo.
   *
   * Read from the Zoom account for Zoom, and from the plan the organiser
   * declared for Google Meet, which is the only way to know: Google reports
   * neither capacity nor edition to the scopes we hold.
   */
  seatLimit: number | null = null,
  /**
   * How long a call may run on that plan, or null when it is not known.
   *
   * Both providers cut a call off at the plan's limit whether or not the event
   * has finished, which would put every attendee out of a call they paid for,
   * partway through. A free personal Google account is the sharpest case at 60
   * minutes.
   */
  maxMeetingMinutes: number | null = null,
  /** Chosen two steps back, and only used to word the two messages above. */
  provider: OnlineProvider = "zoom",
) {
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
      // Optional cutoff after which tickets can no longer be bought. The event
      // stays listed; it is simply shown as "sales ended". Empty = no cutoff.
      ticketSalesEndAt: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      addMeetingDurationIssue(
        ctx,
        data.eventDays,
        maxMeetingMinutes,
        t,
        provider,
      );

      /**
       * The seat cap, across ALL ticket types combined.
       *
       * Three 50-seat tiers on a 100-seat plan still oversells, so the sum is
       * what matters, not each tier. Reported on the last row because that is
       * the one the organiser is editing when they cross the line.
       */
      if (seatLimit !== null) {
        const total = data.ticketTypes.reduce((sum, ticket) => {
          const quantity = parseInt(ticket.ticketTypeQuantity, 10);
          return sum + (isNaN(quantity) ? 0 : quantity);
        }, 0);
        if (total > seatLimit) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t(
              provider === "zoom"
                ? "errors.ticketClass.quantity.exceedsZoomSeats"
                : "errors.ticketClass.quantity.exceedsGoogleSeats",
              { limit: seatLimit },
            ),
            path: [
              "ticketTypes",
              Math.max(0, data.ticketTypes.length - 1),
              "ticketTypeQuantity",
            ],
          });
        }
      }

      if (data.isFree) {
        data.ticketTypes.forEach((ticket, index) => {
          const quantity = parseInt(ticket.ticketTypeQuantity, 10);
          if (!isNaN(quantity) && quantity > freeTicketLimit) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("errors.ticketClass.quantity.exceedsLimit", {
                limit: freeTicketLimit,
              }),
              path: ["ticketTypes", index, "ticketTypeQuantity"],
            });
          }
        });
        return;
      }
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
