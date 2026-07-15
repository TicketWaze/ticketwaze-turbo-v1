"use client";
import { useState } from "react";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale, useTranslations } from "next-intl";
import { EditMemberAction, UpdateMemberPermissionsAction } from "@/actions/organisationActions";
import { useSession } from "next-auth/react";
import { useRef } from "react";
import { toast } from "sonner";
import { OrganisationMember } from "@ticketwaze/typescript-config";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import PermissionPicker from "./PermissionPicker";
import { ROLE_NAMES } from "@/lib/permissionConfig";

export default function EditMemberDialogContent({
  member,
  availablePermissions,
}: {
  member: OrganisationMember;
  availablePermissions: string[];
}) {
  const t = useTranslations("Settings.team");
  const locale = useLocale();
  const { data: session } = useSession();
  const CloseDialogRef = useRef<HTMLButtonElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    member.permissions ?? [],
  );
  const [resetRole, setResetRole] = useState<string>("");

  const orgId = session?.activeOrganisation?.organisationId ?? "";
  const token = session?.user.accessToken ?? "";

  async function savePermissions() {
    if (session?.user.email === member.email) {
      toast.warning(t("noSelfChange"));
      return;
    }
    if (selectedPermissions.length === 0) {
      toast.warning(t("selectPermission"));
      return;
    }
    setIsLoading(true);
    const result = await UpdateMemberPermissionsAction(
      orgId,
      member.userId,
      token,
      selectedPermissions,
      locale,
    );
    if (result?.status === "success") {
      toast.success(t("permissionsSaved"));
    } else {
      toast.error(result?.error);
    }
    setIsLoading(false);
    CloseDialogRef.current?.click();
  }

  async function resetToPreset() {
    if (!resetRole) return;
    if (session?.user.email === member.email) {
      toast.warning(t("noSelfChange"));
      return;
    }
    setIsResetting(true);
    const result = await EditMemberAction(
      orgId,
      member.userId,
      token,
      resetRole,
      locale,
    );
    if (result?.status === "success") {
      toast.success("Role Updated");
    } else {
      toast.error(result?.error);
    }
    setIsResetting(false);
    CloseDialogRef.current?.click();
  }

  return (
    <DialogContent className="w-xl lg:w-232 h-[90dvh] flex flex-col gap-0 p-0 lg:p-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto px-8 pt-8 lg:px-12 lg:pt-18 pb-4 flex flex-col gap-6">
        <DialogHeader>
          <DialogTitle className="font-medium border-b border-neutral-100 pb-8 text-[2.6rem] leading-12 text-black font-primary">
            {t("edit")}
          </DialogTitle>
          <DialogDescription className="sr-only">Edit member</DialogDescription>
        </DialogHeader>

        {/* Custom permissions section */}
        <div className="flex flex-col gap-3">
          <p className="text-[1.4rem] font-medium text-neutral-700">
            {t("permissions")}
          </p>
          <PermissionPicker
            availablePermissions={availablePermissions}
            selected={selectedPermissions}
            onChange={setSelectedPermissions}
          />
        </div>

        {/* Reset to preset section */}
        <div className="flex flex-col gap-3 border-t border-neutral-100 pt-4">
          <p className="text-[1.3rem] font-medium text-neutral-500">
            {t("resetToPreset")}
          </p>
          <div className="flex gap-3 items-center">
            <Select onValueChange={setResetRole} value={resetRole}>
              <SelectTrigger className="flex-1 bg-neutral-100 rounded-[3rem] px-6 py-4 border-none text-[1.4rem] text-neutral-700 leading-8">
                <SelectValue placeholder={t("table.role")} />
              </SelectTrigger>
              <SelectContent className="bg-neutral-100 text-[1.4rem]">
                <SelectGroup>
                  {Object.entries(ROLE_NAMES).map(([num, name]) => (
                    <SelectItem
                      key={num}
                      className="text-[1.4rem] text-deep-100"
                      value={num}
                    >
                      {name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={resetToPreset}
              disabled={!resetRole || isResetting}
              className="px-8 py-4 rounded-[3rem] bg-neutral-200 text-neutral-700 text-[1.4rem] font-medium disabled:opacity-40 hover:bg-neutral-300 transition-colors cursor-pointer whitespace-nowrap"
            >
              {isResetting ? <LoadingCircleSmall /> : t("apply")}
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 pb-8 lg:px-12 lg:pb-18 pt-4">
        <DialogClose ref={CloseDialogRef} className="sr-only" />
        <button
          onClick={savePermissions}
          disabled={isLoading}
          className="w-full bg-primary-500 disabled:bg-primary-500/50 hover:bg-primary-500/80 hover:border-primary-600 px-12 py-6 border-2 border-transparent rounded-[100px] text-center text-white font-medium text-[1.5rem] h-auto leading-8 cursor-pointer transition-all duration-400 flex items-center justify-center"
        >
          {isLoading ? <LoadingCircleSmall /> : t("save")}
        </button>
      </div>
    </DialogContent>
  );
}
