/**
 * LETTING A DIALOG BE DRIVEN FROM OUTSIDE.
 *
 * Every action dialog on this page can be opened two ways: by its own button,
 * or by the More menu. The menu needs the second because of a Radix
 * interaction that is easy to trip over and hard to diagnose —
 *
 * A Dialog opened from inside a Popover renders through a PORTAL, so its DOM
 * lands outside the popover's subtree. The popover reads that as focus having
 * left it and closes, tearing down the element that owns the dialog's state.
 * The dialog flashes and dies, or survives in a state nothing can type into.
 *
 * The fix is to move ownership up: `MoreComponent` holds which dialog should
 * be open, renders all of them at its own top level, and each one takes
 * `open`/`onOpenChange` so the menu drives it. `hideTrigger` suppresses the
 * dialog's own button, which the menu item has replaced.
 *
 * All three props are optional, so a dialog dropped anywhere on its own still
 * works exactly as it did before the menu existed.
 */
export interface DialogControl {
  /** Suppress the dialog's built-in trigger button. */
  hideTrigger?: boolean;
  /** Controlled open state. Omit to let the dialog manage its own. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
