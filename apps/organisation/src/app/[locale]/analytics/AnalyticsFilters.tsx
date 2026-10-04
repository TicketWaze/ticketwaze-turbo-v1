"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import FilterPill from "@/components/shared/FilterPill";
import { PERIODS, type Period } from "./periods";

/** The "All activities" and "This month" pills; both live in the URL. */
export default function AnalyticsFilters({
  events,
  eventId,
  period,
}: {
  events: { eventId: string; eventName: string }[];
  eventId: string | null;
  period: Period;
}) {
  const t = useTranslations("Analytics.filters");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(key: "eventId" | "period", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const isDefault =
      (key === "eventId" && value === "all") ||
      (key === "period" && value === "month");
    if (isDefault) params.delete(key);
    else params.set(key, value);
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  }

  return (
    <div className="flex items-center gap-4" aria-busy={pending}>
      <FilterPill
        label={t("activity")}
        value={eventId ?? "all"}
        defaultValue="all"
        options={[
          { value: "all", label: t("allActivities") },
          ...events.map((e) => ({ value: e.eventId, label: e.eventName })),
        ]}
        onChange={(v) => update("eventId", v)}
        pending={pending}
      />
      <FilterPill
        label={t("period")}
        value={period}
        defaultValue="month"
        options={PERIODS.map((p) => ({ value: p, label: t(`periods.${p}`) }))}
        onChange={(v) => update("period", v)}
        pending={pending}
      />
    </div>
  );
}
