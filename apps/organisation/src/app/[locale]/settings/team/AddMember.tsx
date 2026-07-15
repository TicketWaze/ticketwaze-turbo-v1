"use client";
import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useLocale, useTranslations } from "next-intl";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddMemberAction } from "@/actions/organisationActions";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Input } from "@/components/shared/Inputs";
import PermissionPicker from "./PermissionPicker";
import { usePermission } from "@/hooks/usePermission";

export default function AddMember({
  totalMembers,
  teamLimit,
  availablePermissions,
}: {
  totalMembers: number;
  teamLimit?: number;
  availablePermissions: string[];
}) {
  const t = useTranslations("Settings.team");
  const { can } = usePermission();

  const AddMemberSchema = z.object({
    fullName: z.string().min(1, t("errors.name")),
    email: z.string().email(t("errors.email")),
  });
  type TAddMemberSchema = z.infer<typeof AddMemberSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TAddMemberSchema>({
    resolver: zodResolver(AddMemberSchema),
    defaultValues: { fullName: "", email: "" },
  });

  const { data: session } = useSession();
  const organisation = session?.activeOrganisation;
  const locale = useLocale();
  const CloseDialogRef = useRef<HTMLButtonElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  async function submitHandler(data: TAddMemberSchema) {
    if (!session?.activeOrganisation) {
      toast.error("Session not ready, please try again.");
      return;
    }
    // Prefer the API's effective limit: trial orgs are capped at the free
    // plan's team size even though their session tier says "pro".
    const memberLimit =
      teamLimit ?? session.activeOrganisation.membershipTier?.teamMember;
    if (memberLimit !== undefined && totalMembers >= memberLimit) {
      toast.info(t("teamLimit"));
      return;
    }
    if (selectedPermissions.length === 0) {
      toast.warning(t("selectPermission"));
      return;
    }

    setIsLoading(true);
    const result = await AddMemberAction(
      organisation?.organisationId ?? "",
      { fullName: data.fullName, email: data.email, permissions: selectedPermissions },
      session?.user.accessToken ?? "",
      locale,
    );

    if (result?.status === "success") {
      toast.success("User Invited");
      reset();
      setSelectedPermissions([]);
    } else {
      toast.error(result?.error);
    }
    setIsLoading(false);
    CloseDialogRef.current?.click();
  }

  // Inviting assigns a permission set — Owner-only (roles.manage).
  if (!can("roles.manage")) return null;

  return (
    <Dialog>
      <DialogTrigger className="w-full lg:w-auto">
        <span className="px-12 w-full py-6 border-2 border-transparent rounded-[100px] text-center text-white font-medium text-[1.5rem] h-auto leading-8 cursor-pointer transition-all duration-400 flex items-center justify-center bg-primary-500 hover:bg-primary-500/80 hover:border-primary-600 text-nowrap">
          {t("add")}
        </span>
      </DialogTrigger>

      <DialogContent className="w-xl lg:w-232 h-[90dvh] flex flex-col gap-0 p-0 lg:p-0 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto px-8 pt-8 lg:px-12 lg:pt-18 pb-4 flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle className="font-medium border-b border-neutral-100 pb-8 text-[2.6rem] leading-12 text-black font-primary">
              {t("add")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Add Member
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-start gap-4 rounded-[12px] bg-blue-50 border border-blue-200 px-6 py-5 text-[1.3rem] text-blue-800 leading-relaxed">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mt-[.2px] shrink-0 w-[1.6rem] h-[1.6rem]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                clipRule="evenodd"
              />
            </svg>
            <p>{t("requiresAccount")}</p>
          </div>

          <form className="flex flex-col gap-6">
            <Input
              {...register("fullName")}
              error={errors.fullName?.message}
              disabled={isSubmitting}
              autoFocus={false}
            >
              {t("table.name")}
            </Input>
            <Input
              {...register("email")}
              error={errors.email?.message}
              disabled={isSubmitting}
            >
              {t("table.email")}
            </Input>
          </form>

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
        </div>

        <div className="px-8 pb-8 lg:px-12 lg:pb-18 pt-4">
          <DialogClose ref={CloseDialogRef} className="sr-only" />
          <button
            onClick={handleSubmit(submitHandler)}
            disabled={isLoading}
            className="w-full bg-primary-500 disabled:bg-primary-500/50 hover:bg-primary-500/80 hover:border-primary-600 px-12 py-6 border-2 border-transparent rounded-[100px] text-center text-white font-medium text-[1.5rem] h-auto leading-8 cursor-pointer transition-all duration-400 flex items-center justify-center"
          >
            {isLoading ? <LoadingCircleSmall /> : t("add")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
