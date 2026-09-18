"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Coin1, MoreCircle, SliderHorizontal, UserRemove, UserTick } from "iconsax-reactjs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePermissions } from "@/hooks/usePermissions";
import { SuspendDialog } from "./SuspendDialog";
import { ReactivateDialog } from "./ReactivateDialog";
import { CreditWalletDialog } from "./CreditWalletDialog";

/**
 * THE ADMIN ACTIONS ON ONE ATTENDEE, BEHIND ONE TRIGGER.
 *
 * These used to sit as bare buttons in a row, which worked while there was
 * exactly one of them. It does not scale: every action added to this page is
 * another red or orange button shouting at an admin who came here to read the
 * record, and the dangerous ones stop standing out precisely because
 * everything beside them is equally loud.
 *
 * Behind a menu they read as what they are — a list of things you can choose
 * to do — and the page header goes back to being a header.
 *
 * WHY THE DIALOGS ARE RENDERED OUTSIDE THE POPOVER.
 *
 * Radix's Popover closes on outside-click and on focus leaving it, and a
 * Dialog opened from inside one is a portal: it renders outside the popover's
 * DOM subtree, so opening it reads as focus leaving and tears down the very
 * thing that owns the open dialog. The result is a dialog that flashes and
 * dies, or one that survives but cannot be typed into.
 *
 * So the menu only ever SETS WHICH DIALOG SHOULD BE OPEN and closes itself;
 * the dialogs live at this component's top level, owned by state here. Each
 * one is given `open`/`onOpenChange` so it is fully controlled from here
 * rather than by its own trigger — which is also why each takes a
 * `hideTrigger`.
 */
type PendingAction = "suspend" | "reactivate" | "credit" | null;

export default function MoreComponent({
  userId,
  isSuspended,
}: {
  userId: string;
  isSuspended: boolean;
}) {
  const t = useTranslations("Attendees.profile.more");
  /**
   * `attendees.credit` is a permission in its own right, deliberately not
   * bundled into any role — see the note on it in `admin_roles.ts`. Hiding
   * the entry is a courtesy, not the enforcement: the API refuses the call
   * regardless of what this menu chooses to show.
   */
  const { can } = usePermissions();
  const canCredit = can("attendees.credit");
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, setPending] = useState<PendingAction>(null);

  function choose(action: Exclude<PendingAction, null>) {
    setMenuOpen(false);
    setPending(action);
  }

  const itemClass =
    "cursor-pointer font-normal text-[1.5rem] py-4 leading-8 text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full transition-colors";

  return (
    <>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger aria-label={t("title")}>
          <div className="w-14 h-14 cursor-pointer rounded-full bg-neutral-100 flex items-center justify-center">
            <MoreCircle variant="Bulk" size={20} color="#737C8A" />
          </div>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-100 p-0 m-0 bg-none shadow-none border-none mx-4"
        >
          <ul className="bg-neutral-100 border border-neutral-200 p-4 rounded-2xl shadow-xl flex flex-col gap-2">
            <span className="font-medium py-2 border-b border-neutral-200 text-[1.4rem] text-deep-100 leading-8">
              {t("title")}
            </span>

            {canCredit && (
              <li>
                <button
                  type="button"
                  onClick={() => choose("credit")}
                  className={`${itemClass} border-b border-neutral-200`}
                >
                  <span>{t("credit")}</span>
                  <Coin1 size="20" variant="Bulk" color="#2E3237" />
                </button>
              </li>
            )}

            <li>
              {/*
                Suspending is destructive and reactivating is not, so only the
                destructive one is coloured. An admin scanning this list should
                be able to tell them apart without reading.
              */}
              <button
                type="button"
                onClick={() => choose(isSuspended ? "reactivate" : "suspend")}
                className={`${itemClass} ${
                  isSuspended ? "" : "text-[#E53935] hover:text-[#E53935]"
                }`}
              >
                <span>{isSuspended ? t("reactivate") : t("suspend")}</span>
                {isSuspended ? (
                  <UserTick size="20" variant="Bulk" color="#2E3237" />
                ) : (
                  <UserRemove size="20" variant="Bulk" color="#E53935" />
                )}
              </button>
            </li>

            {!canCredit && (
              /*
                Said rather than left as an unexplained gap. An admin who
                expects to see "credit wallet" and finds nothing assumes the
                page is broken; telling them it is a permission they lack is
                the difference between a bug report and a request.
              */
              <li className="flex items-center gap-3 pt-2 text-[1.2rem] leading-6 text-neutral-500">
                <SliderHorizontal size="16" color="#737C8A" />
                <span>{t("credit_denied")}</span>
              </li>
            )}
          </ul>
        </PopoverContent>
      </Popover>

      {/* Controlled from here — see the note at the top on why these cannot
          live inside the popover. */}
      <SuspendDialog
        userId={userId}
        hideTrigger
        open={pending === "suspend"}
        onOpenChange={(next) => setPending(next ? "suspend" : null)}
      />
      <ReactivateDialog
        userId={userId}
        hideTrigger
        open={pending === "reactivate"}
        onOpenChange={(next) => setPending(next ? "reactivate" : null)}
      />
      {canCredit && (
        <CreditWalletDialog
          userId={userId}
          hideTrigger
          open={pending === "credit"}
          onOpenChange={(next) => setPending(next ? "credit" : null)}
        />
      )}
    </>
  );
}
