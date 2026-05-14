/* eslint-disable react-hooks/refs */
"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import * as z from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import GetRoleName from "@/lib/GetRoleName";
import { AddMemberAction } from "@/actions/organisationActions";
import { useSession } from "next-auth/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Input } from "@/components/shared/Inputs";

export default function AddMember({ totalMembers }: { totalMembers: number }) {
  const t = useTranslations("Settings.team");

  const AddMemberSchema = z.object({
    fullName: z.string().min(1, t("errors.name")),
    email: z.string().email(t("errors.email")),
    role: z.string().min(1).max(4),
  });
  type TAddMemberSchema = z.infer<typeof AddMemberSchema>;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TAddMemberSchema>({
    resolver: zodResolver(AddMemberSchema),
    values: {
      role: "",
      fullName: "",
      email: "",
    },
  });
  const { data: session } = useSession();
  const organisation = session?.activeOrganisation;
  const locale = useLocale();
  const CloseDialogRef = useRef<HTMLButtonElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submitHandler(data: TAddMemberSchema) {
    if (!session?.activeOrganisation) {
      toast.error("Session not ready, please try again.");
      return;
    }

    if (
      totalMembers === session.activeOrganisation.membershipTier?.teamMember
    ) {
      toast.info(t("teamLimit"));
      return;
    }
    setIsLoading(true);
    const result = await AddMemberAction(
      organisation?.organisationId ?? "",
      { ...data, role: parseInt(data.role) },
      session?.user.accessToken ?? "",
      locale,
    );

    if (result?.status === "success") {
      toast.success("User Invited");
    } else {
      toast.error(result?.error);
    }
    setIsLoading(false);
    CloseDialogRef.current?.click();
  }

  return (
    <Dialog>
      <DialogTrigger className={"w-full lg:w-auto"}>
        <span className="px-12 w-full py-6 border-2 border-transparent rounded-[100px] text-center text-white font-medium text-[1.5rem] h-auto leading-8 cursor-pointer transition-all duration-400 flex items-center justify-center bg-primary-500 disabled:bg-primary-500/50 hover:bg-primary-500/80 hover:border-primary-600">
          {t("add")}
        </span>
      </DialogTrigger>
      <DialogContent className={"w-xl lg:w-208 "}>
        <DialogHeader>
          <DialogTitle
            className={
              "font-medium border-b border-neutral-100 pb-8  text-[2.6rem] leading-12 text-black font-primary"
            }
          >
            {t("add")}
          </DialogTitle>
          <DialogDescription className={"sr-only"}>
            <span>Add Member</span>
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
        <form
          className={
            "flex flex-col w-auto justify-center items-center pt-12 gap-12"
          }
        >
          <div className={"w-full flex flex-col gap-6"}>
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
            <div>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange}>
                    <SelectTrigger className="bg-neutral-100 w-full rounded-[3rem] p-10 border-none text-[1.4rem] text-neutral-700 leading-8">
                      <SelectValue placeholder={t("table.role")} />
                    </SelectTrigger>
                    <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
                      <SelectGroup className={"divide-y"}>
                        {Array.from({ length: 4 }).map((_, index) => {
                          return (
                            <SelectItem
                              key={index}
                              className={"text-[1.4rem] text-deep-100"}
                              value={(index + 1).toString()}
                            >
                              {GetRoleName(index + 1)}
                            </SelectItem>
                          );
                        })}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <DialogClose ref={CloseDialogRef} className="w-full">
            <span
              onClick={handleSubmit(submitHandler)}
              className={
                "w-full bg-primary-500 disabled:bg-primary-500/50 hover:bg-primary-500/80 hover:border-primary-600 px-12 py-6 border-2 border-transparent rounded-[100px] text-center text-white font-medium text-[1.5rem] h-auto leading-8 cursor-pointer transition-all duration-400 flex items-center justify-center"
              }
            >
              {isLoading ? <LoadingCircleSmall /> : t("add")}
            </span>
          </DialogClose>
        </form>
      </DialogContent>
    </Dialog>
  );
}
