"use client";
import { ArrowLeft2, ArrowRight2 } from "iconsax-reactjs";

/**
 * Local yyyy-MM-dd. Deliberately not toISOString(), which converts to UTC and
 * hands back yesterday for anyone west of Greenwich — including Haiti.
 */
export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * A month grid for picking a day.
 *
 * Three reasons a day can be unpickable, shown differently on purpose: the past
 * is simply dimmed, a day the venue never opens is struck through, and anything
 * beyond the booking window is dimmed too. Guessing why a date will not respond
 * is the main way a booking form loses people.
 *
 * Capacity is NOT reflected here. Whether a table is free depends on party size
 * and time, which is what the slot list answers — colouring the grid by it would
 * mean one request per day and a calendar that flickers as party size changes.
 */
export default function Calendar({
  month,
  selected,
  openDays,
  maxDate,
  locale,
  onMonthChange,
  onSelect,
  closedLabel,
}: {
  month: Date;
  selected: string;
  /** Weekdays the venue opens at all, 0=Sun..6=Sat — the hours-row shape. */
  openDays: Set<number>;
  maxDate: string;
  locale: string;
  onMonthChange: (next: Date) => void;
  onSelect: (dateKey: string) => void;
  closedLabel: string;
}) {
  const now = new Date();
  const today = toDateKey(now);
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  // Sunday-first, matching the 0=Sun..6=Sat the hours rows use.
  const leadingBlanks = new Date(year, monthIndex, 1).getDay();

  // Weekday initials taken from a known Sunday so they follow the locale.
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 8, 1 + i).toLocaleDateString(locale, { weekday: "short" }),
  );

  // Never page back before the current month; nothing there is bookable.
  const canGoBack =
    year > now.getFullYear() ||
    (year === now.getFullYear() && monthIndex > now.getMonth());

  return (
    // Fills its column — the parent decides the width, not the calendar.
    <div className="w-full p-6 lg:p-8 rounded-[20px] border border-neutral-100 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={!canGoBack}
          onClick={() => onMonthChange(new Date(year, monthIndex - 1, 1))}
          aria-label="Previous month"
          className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowLeft2 size="16" color="#737C8A" variant="Bulk" />
        </button>
        <span className="text-[1.6rem] font-medium text-deep-100 capitalize">
          {month.toLocaleDateString(locale, { month: "long", year: "numeric" })}
        </span>
        <button
          type="button"
          onClick={() => onMonthChange(new Date(year, monthIndex + 1, 1))}
          aria-label="Next month"
          className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center cursor-pointer"
        >
          <ArrowRight2 size="16" color="#737C8A" variant="Bulk" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 lg:gap-2">
        {weekdays.map((label, i) => (
          <span
            key={i}
            className="text-[1.1rem] lg:text-[1.3rem] text-neutral-600 text-center uppercase py-2"
          >
            {label}
          </span>
        ))}

        {Array.from({ length: leadingBlanks }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const cellDate = new Date(year, monthIndex, day);
          const key = toDateKey(cellDate);

          const isPast = key < today;
          const isBeyondWindow = key > maxDate;
          const isClosed = !openDays.has(cellDate.getDay());
          const disabled = isPast || isBeyondWindow || isClosed;
          const isSelected = key === selected;
          const isToday = key === today;
          // Struck through only when the venue is shut that weekday — not when
          // the date is merely past, where a strike would say the wrong thing.
          const strike = isClosed && !isPast && !isBeyondWindow;

          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(key)}
              title={strike ? closedLabel : undefined}
              className={`aspect-square rounded-full flex items-center justify-center text-[1.4rem] lg:text-[1.6rem] transition-colors ${
                isSelected
                  ? "bg-primary-500 text-white font-medium cursor-pointer"
                  : disabled
                    ? `text-neutral-500 cursor-not-allowed ${
                        strike ? "line-through opacity-60" : "opacity-40"
                      }`
                    : "text-deep-100 hover:bg-primary-100 cursor-pointer"
              } ${isToday && !isSelected ? "ring-1 ring-primary-500" : ""}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
