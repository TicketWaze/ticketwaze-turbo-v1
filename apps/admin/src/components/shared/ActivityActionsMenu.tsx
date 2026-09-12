"use client";

import Link from "next/link";
import { MoreCircle } from "iconsax-reactjs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * The actions on an activity's admin page, collapsed into one menu.
 *
 * They used to be four coloured pills in a row — Edit, Change Status, Giveaway,
 * Refund & cancel — which wrapped onto a second line at anything under a wide
 * desktop and gave a destructive action the same visual weight as a link. This
 * mirrors the organiser dashboard's own "more" menu: one neutral circular
 * trigger, and a list where each row is a label with its icon.
 *
 * IT DOES NOT RENDER THE DIALOGS. Each row only reports that it was chosen, and
 * the page owns which dialog is open. That is not indirection for its own sake:
 * a Radix dialog mounted inside a popover is unmounted by the very click that
 * opens it, because that click closes the popover. The dialogs have to be
 * siblings of this, so the state that opens them has to live above it.
 */

export type ActivityAction = {
  /** Stable key — also what the page switches on to open the right dialog. */
  key: string;
  label: string;
  icon?: React.ReactNode;
  /** Renders the row as a link instead of a button. */
  href?: string;
  onSelect?: () => void;
  /** Destructive actions read in red, so they cannot be picked up in passing. */
  danger?: boolean;
  /** When set, the row is inert and says why on hover. */
  disabledReason?: string | null;
};

export default function ActivityActionsMenu({
  actions,
  label,
}: {
  actions: (ActivityAction | false | null | undefined)[];
  /** Heading on the menu — "Actions". */
  label: string;
}) {
  const items = actions.filter(Boolean) as ActivityAction[];
  if (items.length === 0) return null;

  const rowClass =
    "cursor-pointer font-normal text-[1.5rem] border-b border-neutral-200 last:border-b-0 py-4 leading-8 flex items-center justify-between gap-6 w-full text-left";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="w-14 h-14 shrink-0 cursor-pointer rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors flex items-center justify-center"
        >
          <MoreCircle variant="Bulk" size={20} color="#737C8A" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-100 p-0 m-0 bg-none shadow-none border-none"
      >
        <ul className="bg-neutral-100 border border-neutral-200 p-4 rounded-2xl shadow-xl flex flex-col gap-1">
          <span className="font-medium py-2 border-b border-neutral-200 text-[1.4rem] text-deep-100 leading-8">
            {label}
          </span>

          {items.map((action) => {
            const tone = action.disabledReason
              ? "text-neutral-400 cursor-not-allowed"
              : action.danger
                ? "text-failure hover:opacity-70"
                : "text-neutral-700 hover:text-primary-500";

            const body = (
              <>
                <span>{action.label}</span>
                {action.icon}
              </>
            );

            if (action.disabledReason) {
              return (
                <li key={action.key}>
                  <div
                    title={action.disabledReason}
                    className={`${rowClass} ${tone}`}
                  >
                    {body}
                  </div>
                </li>
              );
            }

            return (
              <li key={action.key}>
                {action.href ? (
                  <Link href={action.href} className={`${rowClass} ${tone}`}>
                    {body}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={action.onSelect}
                    className={`${rowClass} ${tone}`}
                  >
                    {body}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
