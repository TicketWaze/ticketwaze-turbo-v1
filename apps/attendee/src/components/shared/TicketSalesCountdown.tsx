"use client";
import { useEffect, useState } from "react";
import { Timer1 } from "iconsax-reactjs";
import { useTranslations } from "next-intl";

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getRemaining(target: number): Remaining | null {
  const diff = target - Date.now();
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

// Live "ticket sales end in …" countdown for events that carry a
// `ticketSalesEndAt` cutoff. Renders nothing when there is no cutoff or it has
// already passed (the "sales ended" state is handled elsewhere).
export default function TicketSalesCountdown({
  endsAt,
  variant = "compact",
  className = "",
}: {
  endsAt?: string | null;
  variant?: "compact" | "full";
  className?: string;
}) {
  const t = useTranslations("Event");
  const target = endsAt ? new Date(endsAt).getTime() : NaN;

  // Start null so server and first client render agree (no hydration mismatch);
  // the real value is filled in on mount and ticks every second.
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    if (Number.isNaN(target)) return;
    setRemaining(getRemaining(target));
    const id = setInterval(() => setRemaining(getRemaining(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (Number.isNaN(target) || !remaining) return null;

  const { days, hours, minutes, seconds } = remaining;
  const u = (k: string) => t(`countdownUnits.${k}`);
  let label: string;
  if (days > 0) {
    label = `${days}${u("d")} ${hours}${u("h")} ${minutes}${u("m")} ${seconds}${u("s")}`;
  } else if (hours > 0) {
    label = `${hours}${u("h")} ${minutes}${u("m")} ${seconds}${u("s")}`;
  } else if (minutes > 0) {
    label = `${minutes}${u("m")} ${seconds}${u("s")}`;
  } else {
    label = `${seconds}${u("s")}`;
  }

  // Under an hour left reads as urgent.
  const urgent = days === 0 && hours === 0;

  if (variant === "full") {
    return (
      <div
        className={`flex items-center gap-2 px-6 py-4 rounded-[10px] ${
          urgent ? "bg-[#FCE5EA]" : "bg-primary-50"
        } ${className}`}
      >
        <Timer1
          size="18"
          variant="Bulk"
          color={urgent ? "#DE0028" : "#E45B00"}
        />
        <span
          className={`text-[1.4rem] leading-8 font-medium ${
            urgent ? "text-failure" : "text-primary-500"
          }`}
        >
          {t("salesEndsIn", { time: label })}
        </span>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap ${
        urgent ? "text-failure" : "text-neutral-700"
      } ${className}`}
    >
      <Timer1
        size="13"
        variant="Bulk"
        color={urgent ? "#DE0028" : "#737C8A"}
      />
      <span className="font-medium text-[1rem] leading-6">
        {t("salesEndsIn", { time: label })}
      </span>
    </span>
  );
}
