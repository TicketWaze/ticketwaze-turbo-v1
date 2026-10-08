"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Coin1, More } from "iconsax-reactjs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { SuspendDialog } from "./SuspendDialog";
import { ReactivateDialog } from "./ReactivateDialog";
import { CreditWalletDialog } from "./CreditWalletDialog";

const pill =
  "h-[4.4rem] px-3 sm:px-8 rounded-[10rem] text-[1.3rem] sm:text-[1.4rem] font-medium inline-flex items-center justify-center whitespace-nowrap cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex-1 sm:flex-none min-w-0";

/**
 * Figma's profile header: "Suspend account" (outlined red) and "Edit profile"
 * (orange). While editing, the pair becomes Cancel / Save changes. Crediting a
 * wallet, held back from every role, stays in a small ⋯ beside them.
 *
 * The dialogs are rendered here rather than inside the popover: a Dialog
 * opened from a Popover is a portal, and Radix reads that as focus leaving the
 * popover and tears both down (see lib/dialogControl.ts).
 */
export default function ProfileActions({
  userId,
  isSuspended,
  editing,
  saving,
  onEdit,
  onCancel,
  onSave,
}: {
  userId: string;
  isSuspended: boolean;
  editing: boolean;
  saving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const t = useTranslations("Attendees.profile");
  const { can } = usePermissions();
  const canEdit = can("attendees.edit");
  const canCredit = can("attendees.credit");
  const [dialog, setDialog] = useState<"suspend" | "reactivate" | "credit" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        {editing ? (
          <>
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className={cn(pill, "border-2 border-neutral-200 text-neutral-700 hover:bg-neutral-50")}
            >
              {t("edit.cancel")}
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className={cn(pill, "sm:min-w-[14rem] bg-primary-500 text-white hover:bg-primary-600")}
            >
              {saving ? <LoadingCircleSmall /> : t("edit.save")}
            </button>
          </>
        ) : (
          <>
            {canEdit &&
              (isSuspended ? (
                <button
                  type="button"
                  onClick={() => setDialog("reactivate")}
                  className={cn(pill, "border-2 border-success text-success bg-success/5 hover:bg-success/10")}
                >
                  {t("reactivate.trigger")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setDialog("suspend")}
                  className={cn(pill, "border-2 border-failure text-failure bg-failure/5 hover:bg-failure/10")}
                >
                  {t("suspend.trigger")}
                </button>
              ))}
            {canEdit && (
              <button
                type="button"
                onClick={onEdit}
                className={cn(pill, "bg-primary-500 text-white hover:bg-primary-600")}
              >
                {t("button.edit")}
              </button>
            )}
            {canCredit && (
              <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                <PopoverTrigger
                  aria-label={t("more.title")}
                  className="w-[4.4rem] h-[4.4rem] rounded-full bg-neutral-100 flex items-center justify-center cursor-pointer hover:bg-neutral-200"
                >
                  <More size="18" color="#737C8A" />
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-[22rem] p-[.6rem] bg-white border border-neutral-100 rounded-[1rem] shadow-[0px_5px_10px_0px_rgba(0,0,0,0.1)]"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setDialog("credit");
                    }}
                    className="w-full flex items-center justify-between gap-4 px-[1rem] py-[.8rem] rounded-[.75rem] text-[1.4rem] text-deep-100 cursor-pointer hover:bg-neutral-100"
                  >
                    {t("more.credit")}
                    <Coin1 size="18" variant="Bulk" color="#2E3237" />
                  </button>
                </PopoverContent>
              </Popover>
            )}
          </>
        )}
      </div>

      <SuspendDialog
        userId={userId}
        hideTrigger
        open={dialog === "suspend"}
        onOpenChange={(next) => setDialog(next ? "suspend" : null)}
      />
      <ReactivateDialog
        userId={userId}
        hideTrigger
        open={dialog === "reactivate"}
        onOpenChange={(next) => setDialog(next ? "reactivate" : null)}
      />
      {canCredit && (
        <CreditWalletDialog
          userId={userId}
          hideTrigger
          open={dialog === "credit"}
          onOpenChange={(next) => setDialog(next ? "credit" : null)}
        />
      )}
    </>
  );
}
