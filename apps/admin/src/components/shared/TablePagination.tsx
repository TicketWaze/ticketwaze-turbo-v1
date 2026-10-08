"use client";
import { motion } from "motion/react";
import { ArrowLeft2, ArrowRight2 } from "iconsax-reactjs";
import { tabSpring } from "@/components/shared/motion";
import { cn } from "@/lib/utils";

/** ‹ 1 2 3 4 5 6 7 8 … 50 › — the current page's neighbours, plus both ends. */
export default function TablePagination({
  page,
  count,
  onChange,
  prevLabel,
  nextLabel,
}: {
  page: number;
  count: number;
  onChange: (page: number) => void;
  prevLabel: string;
  nextLabel: string;
}) {
  const pages: (number | "gap")[] = [];
  const near = new Set([
    1,
    count,
    page - 2,
    page - 1,
    page,
    page + 1,
    page + 2,
  ]);
  // Near the start, fill out to 8 like the design.
  if (page <= 4) for (let p = 1; p <= Math.min(8, count); p++) near.add(p);
  if (page >= count - 3)
    for (let p = Math.max(1, count - 7); p <= count; p++) near.add(p);
  let last = 0;
  for (let p = 1; p <= count; p++) {
    if (!near.has(p)) continue;
    if (p - last > 1) pages.push("gap");
    pages.push(p);
    last = p;
  }
  const arrow =
    "w-[3rem] h-[3rem] flex items-center justify-center rounded-full cursor-pointer disabled:opacity-30 disabled:cursor-default hover:bg-neutral-100";
  return (
    <nav
      className="flex items-center gap-1 lg:gap-2 flex-wrap"
      aria-label="Pagination"
    >
      <button
        type="button"
        className={arrow}
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        aria-label={prevLabel}
      >
        <ArrowLeft2 size="16" color="#2E3237" aria-hidden />
      </button>
      {pages.map((p, i) =>
        p === "gap" ? (
          <span
            key={`gap-${i}`}
            className="w-[2.6rem] text-center font-sans text-[1.3rem] text-neutral-500"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "relative min-w-[2.6rem] h-[3rem] px-1 rounded-full font-sans text-[1.3rem] cursor-pointer transition-colors",
              p === page
                ? "text-black font-semibold"
                : "text-neutral-600 hover:text-black",
            )}
          >
            {p === page && (
              <motion.span
                layoutId="tickets-page"
                className="absolute inset-x-1 bottom-0 h-[.2rem] rounded-full bg-primary-500"
                transition={tabSpring}
              />
            )}
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        className={arrow}
        disabled={page === count}
        onClick={() => onChange(page + 1)}
        aria-label={nextLabel}
      >
        <ArrowRight2 size="16" color="#2E3237" aria-hidden />
      </button>
    </nav>
  );
}
