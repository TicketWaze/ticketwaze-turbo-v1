"use client";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GOOGLE_PLANS,
  GOOGLE_PLAN_LIMITS,
  type GooglePlan,
  sellableSeats,
} from "@/lib/googleMeetPlans";

/**
 * WHICH GOOGLE PLAN THIS ACCOUNT IS ON, ASKED RATHER THAN DETECTED.
 *
 * Shared by the settings card and the create flow so an organiser is asked the
 * same question the same way in both places, and so the two cannot drift into
 * offering different plans.
 *
 * The limits sit in the option text on purpose. The failure this exists to stop
 * is an organiser who does not know their free Gmail cuts a group call off after
 * an hour, and a bare list of plan names would teach them nothing — they would
 * pick the right plan and still schedule a three-hour event. Seeing "60 minutes"
 * beside "Free" at the moment of choosing is most of the fix.
 */
export default function GooglePlanSelect({
  value,
  onChange,
  disabled,
}: {
  value: GooglePlan | null;
  onChange: (plan: GooglePlan) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("Settings.integrations.google.plans");

  return (
    <Select
      value={value ?? undefined}
      onValueChange={(next) => onChange(next as GooglePlan)}
      disabled={disabled}
    >
      <SelectTrigger className="bg-neutral-100 w-full rounded-[5rem] p-12 text-[1.5rem] leading-8 placeholder:text-neutral-600 text-deep-200 outline-none border border-transparent focus:border-primary-500">
        <SelectValue placeholder={t("placeholder")} />
      </SelectTrigger>
      {/*
        Bounded to the viewport rather than to the label. "Workspace Business
        Standard · 149 tickets · 24 hours" is a long line, and inside the
        360px-wide create dialog an unbounded menu would run off the screen.
      */}
      <SelectContent className="max-w-[min(90vw,480px)]">
        {GOOGLE_PLANS.map((plan) => (
          <SelectItem
            key={plan}
            value={plan}
            // Wraps instead of overflowing: the limits are the reason this
            // dropdown exists, so they must stay readable at any width.
            className="text-[1.5rem] leading-8 text-deep-200 whitespace-normal"
          >
            {t("option", {
              name: t(plan),
              seats: sellableSeats(plan),
              duration: formatDuration(
                GOOGLE_PLAN_LIMITS[plan].maxMeetingMinutes,
                t,
              ),
            })}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Minutes below two hours, hours above.
 *
 * "1 hour" for the free tier would read as a rounding artefact; 60 minutes is
 * how Google states it and how an organiser will recognise it.
 */
export function formatDuration(
  minutes: number,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  return minutes < 120
    ? t("durationMinutes", { minutes })
    : t("durationHours", { hours: Math.floor(minutes / 60) });
}
