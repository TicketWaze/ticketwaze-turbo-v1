"use client";
import { Warning2 } from "iconsax-reactjs";
import ToggleIcon from "@/components/shared/ToggleIcon";

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Namespaced translator for `Events.create_event`. */
  t: (key: string) => string;
  /**
   * Shows the note explaining that a change applies to future sales only.
   * Passed by the edit forms, where the activity may already have sold.
   */
  showEditNote?: boolean;
  /** Distinguishes the checkbox when two of these render on one page. */
  id?: string;
};

/**
 * WHO PAYS THE FEES, as one switch over the whole activity.
 *
 * Sits between the currency card and the ticket classes, because it is a
 * consequence of the currency choice and a premise of every price typed below
 * it: an organiser needs to have decided this before the price they type means
 * anything definite.
 *
 * Deliberately built from the same card shell and the same switch markup as the
 * free/refundable toggles it sits beside, rather than anything of its own — it
 * is the same kind of decision at the same scope, and it should not announce
 * itself as a different kind of control.
 *
 * One switch for the activity rather than one per tier. The fee schedule is the
 * activity's, the payment routes are the activity's, and a tier-by-tier version
 * would let one activity quote prices that mean two different things.
 */
export default function AbsorbFeesToggle({
  checked,
  onChange,
  t,
  showEditNote = false,
  id = "absorb-fees",
}: Props) {
  return (
    <div className="max-w-216 w-full mx-auto p-6 rounded-[15px] flex flex-col gap-6 border border-neutral-100">
      <div className="flex items-center justify-between">
        <p className="text-[1.6rem] leading-8 text-deep-100 max-w-152">
          {t("absorb_fees")}
        </p>
        <label className="relative inline-block h-12 w-20 cursor-pointer rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:transparent] has-checked:bg-primary-500 has-disabled:cursor-not-allowed">
          <input
            className="peer sr-only"
            id={id}
            type="checkbox"
            checked={checked}
            onChange={() => onChange(!checked)}
          />
          <ToggleIcon />
        </label>
      </div>

      <div className="flex flex-col items-start gap-4 border p-4 rounded-2xl border-neutral-300">
        <Warning2 size="24" color="#737C8A" variant="Bulk" />
        <div className="flex flex-col gap-2">
          <p className="text-[1.2rem] leading-8 text-neutral-800">
            {t("absorb_fees_hint")}
          </p>
          {showEditNote && (
            <p className="text-[1.2rem] leading-8 text-neutral-600">
              {t("absorb_fees_locked")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
