"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDown2, ArrowLeft2, ArrowRight2, Check } from "iconsax-reactjs";
import { Event } from "@ticketwaze/typescript-config";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Explore's filters (Figma "Search and Filter"): category tabs, then Category,
// Location, Date and Popularity dropdowns. Everything filters the activities
// the page already has; nothing goes back to the API.

export type DateRange = { from: string; to?: string }; // YYYY-MM-DD
export type ExploreFilterState = {
  category?: string; // events.event_type
  city?: string;
  date?: DateRange;
  sort: "soonest" | "popular";
};

type WithViews = Event & { viewCount?: number };

const ease = [0.22, 1, 0.36, 1] as const;

/** Every day an activity takes place on, as YYYY-MM-DD. */
function activityDays(event: Event): string[] {
  const days = (event.eventDays ?? []).map((day) =>
    String(day.eventDate).slice(0, 10),
  );
  if (days.length === 0 && event.comingSoonDate)
    days.push(String(event.comingSoonDate).slice(0, 10));
  return days;
}

export function applyExploreFilters<T extends WithViews>(
  events: T[],
  filters: ExploreFilterState,
): T[] {
  const { category, city, date, sort } = filters;
  const from = date?.from;
  const to = date?.to ?? date?.from;
  const filtered = events.filter((event) => {
    if (category && event.eventType !== category) return false;
    if (city && event.city !== city) return false;
    if (from && to) {
      if (!activityDays(event).some((day) => day >= from && day <= to))
        return false;
    }
    return true;
  });
  return sort === "popular"
    ? [...filtered].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
    : filtered;
}

export function hasActiveFilters(filters: ExploreFilterState) {
  return Boolean(
    filters.category ||
    filters.city ||
    filters.date ||
    filters.sort === "popular",
  );
}

// ── Category tabs ─────────────────────────────────────────────────────────

export function CategoryTabs({
  categories,
  value,
  onChange,
}: {
  categories: string[];
  value?: string;
  onChange: (category?: string) => void;
}) {
  const t = useTranslations("Explore");
  const tabs = [undefined, ...categories];
  return (
    <div className="bg-neutral-100 rounded-[30px] p-[7.5px] flex items-center w-fit max-w-full overflow-x-auto no-scrollbar">
      {tabs.map((category) => {
        const active = value === category;
        return (
          <button
            key={category ?? "all"}
            type="button"
            onClick={() => onChange(category)}
            className={cn(
              "relative px-[15px] py-[5px] rounded-[30px] text-[1.4rem] leading-8 whitespace-nowrap cursor-pointer transition-colors duration-200",
              active ? "text-white" : "text-neutral-700 hover:text-deep-100",
            )}
          >
            {active && (
              <motion.span
                layoutId="explore-category-tab"
                className="absolute inset-0 rounded-[30px] bg-black"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">
              {category ? t(`categories.${category}`) : t("filters.all")}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Dropdown chip ─────────────────────────────────────────────────────────

function Chip({
  label,
  active,
  open,
}: {
  label: string;
  active: boolean;
  open: boolean;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-[5px] px-[15px] py-[7.5px] rounded-[30px] text-[1.4rem] leading-8 whitespace-nowrap transition-colors duration-200",
        active
          ? "bg-primary-50 text-primary-500"
          : "bg-neutral-100 text-neutral-700 hover:text-deep-100",
      )}
    >
      {label}
      <motion.span
        animate={{ rotate: open ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        className="flex"
      >
        <ArrowDown2
          size={20}
          variant="Bulk"
          color={active ? "#E45B00" : "#737C8A"}
        />
      </motion.span>
    </span>
  );
}

const panelClass =
  "w-auto min-w-[22rem] p-[10px] bg-white border border-neutral-100 rounded-[10px] shadow-[0px_5px_10px_0px_rgba(0,0,0,0.1)]";

export function FilterSelect({
  label,
  options,
  value,
  onChange,
  resetLabel,
}: {
  label: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange: (value?: string) => void;
  /** First row that clears the filter, e.g. "All locations". */
  resetLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const rows = resetLabel
    ? [{ value: undefined, label: resetLabel }, ...options]
    : options;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="cursor-pointer">
        <Chip
          label={selected?.label ?? label}
          active={Boolean(selected) && Boolean(resetLabel)}
          open={open}
        />
      </PopoverTrigger>
      <PopoverContent align="end" className={panelClass}>
        <p className="px-[10px] pt-[5px] pb-[10px] text-[1.4rem] font-medium text-deep-100">
          {label}
        </p>
        <ul className="flex flex-col max-h-[30rem] overflow-y-auto">
          {rows.map((row, i) => {
            const active = row.value === value;
            return (
              <motion.li
                key={row.value ?? "reset"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.025, ease }}
              >
                <button
                  type="button"
                  onClick={() => {
                    onChange(row.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-6 px-[10px] py-[8px] rounded-[7.5px] text-left text-[1.4rem] leading-8 cursor-pointer transition-colors",
                    active
                      ? "bg-primary-50 text-primary-500"
                      : "text-deep-100 hover:bg-neutral-100",
                  )}
                >
                  {row.label}
                  {active && <Check size={16} color="#E45B00" />}
                </button>
              </motion.li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

// ── Date / range picker (Figma Picker/Date, Month, Year, Range) ────────────

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromIso = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const display = (value?: string) =>
  value ? value.split("-").reverse().join(" - ") : undefined;

export function DateFilter({
  value,
  onChange,
}: {
  value?: DateRange;
  onChange: (value?: DateRange) => void;
}) {
  const t = useTranslations("Explore.filters");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"days" | "months" | "years">("days");
  const [cursor, setCursor] = useState(() =>
    value ? fromIso(value.from) : new Date(),
  );
  const [direction, setDirection] = useState(0);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  // Short form for the chip ("10 Oct → 20 Oct"); the panel shows full dates.
  const short = (day: string) =>
    fromIso(day).toLocaleDateString(locale, { day: "numeric", month: "short" });
  const label = value
    ? value.to && value.to !== value.from
      ? `${short(value.from)} → ${short(value.to)}`
      : short(value.from)
    : t("date");

  function pick(day: string) {
    // First click starts a range, a later day closes it; clicking the start
    // again (or a day before it) starts over.
    if (!value || value.to || day <= value.from) onChange({ from: day });
    else onChange({ from: value.from, to: day });
  }

  function shiftMonth(delta: number) {
    setDirection(delta);
    setCursor(new Date(year, month + delta, 1));
  }

  // Monday-first grid with the neighbouring months' days greyed out.
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const cells = Array.from(
    { length: 42 },
    (_, i) => new Date(year, month, i - lead + 1),
  );
  const weeks = cells[35].getMonth() !== month ? 5 : 6;
  const today = iso(new Date());
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: "narrow" }),
  );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setView("days");
      }}
    >
      <PopoverTrigger className="cursor-pointer">
        <Chip label={label} active={Boolean(value)} open={open} />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[34rem] p-[10px] bg-neutral-100 border-none rounded-[10px] shadow-[0px_5px_10px_0px_rgba(0,0,0,0.1)]"
      >
        {/* From → To, as in Figma's range picker. */}
        <div className="flex items-center justify-between gap-4 rounded-[10px] bg-neutral-200 px-[15px] py-[12px] mb-[10px] text-[1.4rem]">
          <span className={value ? "text-primary-500" : "text-neutral-600"}>
            {display(value?.from) ?? t("datePlaceholder")}
          </span>
          <ArrowRight2 size={16} color="#8F96A1" />
          <span className={value?.to ? "text-primary-500" : "text-neutral-600"}>
            {display(value?.to) ?? t("datePlaceholder")}
          </span>
        </div>

        <div className="flex items-center justify-between h-[6rem] px-[5px]">
          <button
            type="button"
            aria-label="Previous"
            onClick={() =>
              view === "days"
                ? shiftMonth(-1)
                : view === "years"
                  ? setCursor(new Date(year - 12, month, 1))
                  : setView("days")
            }
            className="size-[3.5rem] rounded-full bg-neutral-200 flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
          >
            <ArrowLeft2 size={14} color="#2E3237" variant="Bold" />
          </button>
          <button
            type="button"
            onClick={() =>
              setView(
                view === "days"
                  ? "months"
                  : view === "months"
                    ? "years"
                    : "days",
              )
            }
            className="text-[1.6rem] text-deep-100 cursor-pointer hover:text-primary-500 transition-colors"
          >
            {view === "days"
              ? cursor.toLocaleDateString(locale, {
                  month: "long",
                  year: "numeric",
                })
              : view === "months"
                ? t("chooseMonth")
                : t("chooseYear")}
          </button>
          {view !== "months" ? (
            <button
              type="button"
              aria-label="Next"
              onClick={() =>
                view === "days"
                  ? shiftMonth(1)
                  : setCursor(new Date(year + 12, month, 1))
              }
              className="size-[3.5rem] rounded-full bg-neutral-200 flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
            >
              <ArrowRight2 size={14} color="#2E3237" variant="Bold" />
            </button>
          ) : (
            <span className="size-[3.5rem]" />
          )}
        </div>

        <AnimatePresence mode="wait" initial={false} custom={direction}>
          {view === "days" && (
            <motion.div
              key={`days-${year}-${month}`}
              custom={direction}
              initial={{ opacity: 0, x: direction * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -24 }}
              transition={{ duration: 0.2, ease }}
            >
              <div className="grid grid-cols-7 text-center text-[1.4rem] text-neutral-600 mb-2">
                {weekdays.map((day, i) => (
                  <span key={i} className="py-[8px] uppercase">
                    {day}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-[4px] text-center text-[1.4rem]">
                {cells.slice(0, weeks * 7).map((cell) => {
                  const day = iso(cell);
                  const inMonth = cell.getMonth() === month;
                  const start = value?.from === day;
                  const end = (value?.to ?? value?.from) === day;
                  const between =
                    value?.to && day > value.from && day < value.to;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => pick(day)}
                      className={cn(
                        "h-[4rem] flex items-center justify-center cursor-pointer transition-colors duration-150",
                        start || end
                          ? "bg-primary-500 text-white"
                          : between
                            ? "bg-primary-500 text-white"
                            : inMonth
                              ? "text-deep-100 hover:bg-neutral-200 rounded-[8px]"
                              : "text-neutral-400 hover:bg-neutral-200 rounded-[8px]",
                        start && end && "rounded-[8px]",
                        start && !end && "rounded-l-[8px]",
                        end && !start && "rounded-r-[8px]",
                        day === today &&
                          !start &&
                          !end &&
                          !between &&
                          "font-semibold text-primary-500",
                      )}
                    >
                      {cell.getDate()}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
          {view === "months" && (
            <motion.div
              key="months"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease }}
              className="grid grid-cols-3 gap-[10px] pb-[5px]"
            >
              {Array.from({ length: 12 }, (_, m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setCursor(new Date(year, m, 1));
                    setView("days");
                  }}
                  className={cn(
                    "h-[6rem] rounded-[10px] text-[1.4rem] cursor-pointer transition-colors",
                    m === month
                      ? "bg-primary-500 text-white"
                      : "text-neutral-700 hover:bg-neutral-200",
                  )}
                >
                  {new Date(2024, m, 1).toLocaleDateString(locale, {
                    month: "short",
                  })}
                </button>
              ))}
            </motion.div>
          )}
          {view === "years" && (
            <motion.div
              key={`years-${year}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease }}
              className="grid grid-cols-3 gap-[10px] pb-[5px]"
            >
              {Array.from({ length: 12 }, (_, i) => year - 4 + i).map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setCursor(new Date(y, month, 1));
                    setView("months");
                  }}
                  className={cn(
                    "h-[5rem] rounded-[10px] text-[1.4rem] cursor-pointer transition-colors",
                    y === year
                      ? "bg-primary-500 text-white"
                      : "text-neutral-700 hover:bg-neutral-200",
                  )}
                >
                  {y}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {value && (
          <button
            type="button"
            onClick={() => {
              onChange(undefined);
              setOpen(false);
            }}
            className="mt-[10px] w-full text-center text-[1.3rem] text-primary-500 hover:underline cursor-pointer"
          >
            {t("anyDate")}
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
