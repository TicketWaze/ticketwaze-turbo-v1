"use client";
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
import * as z from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import GetRoleName from "@/lib/GetRoleName";
import { EditMemberAction } from "@/actions/organisationActions";
import { useSession } from "next-auth/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { User } from "@ticketwaze/typescript-config";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";

export default function EditMemberDialogContent({
  userId,
  defaultRole,
  user,
}: {
  userId: string;
  defaultRole: string;
  user: User;
}) {
  const t = useTranslations("Settings.team");
  const locale = useLocale();
  const AddMemberSchema = z.object({
    role: z.string().min(1).max(1),
  });
  type TAddMemberSchema = z.infer<typeof AddMemberSchema>;
  const { control, handleSubmit } = useForm<TAddMemberSchema>({
    resolver: zodResolver(AddMemberSchema),
    values: {
      role: defaultRole,
    },
  });
  const { data: session } = useSession();
  const organisation = session?.activeOrganisation;
  const CloseDialogRef = useRef<HTMLButtonElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  async function submitHandler(data: TAddMemberSchema) {
    setIsLoading(true);
    if (session?.user.email === user.email) {
      toast.warning(t("noSelfChange"));
      setIsLoading(false);
      CloseDialogRef.current?.click();
      return;
    }
    const result = await EditMemberAction(
      organisation?.organisationId ?? "",
      userId,
      user.accessToken,
      data.role,
      locale,
    );
    if (result?.status === "success") {
      toast.success("Role Updated");
    } else {
      toast.error(result?.error);
    }
    setIsLoading(false);
    CloseDialogRef.current?.click();
  }
  return (
    <DialogContent className={"w-xl lg:w-208 "}>
      <DialogHeader>
        <DialogTitle
          className={
            "font-medium border-b border-neutral-100 pb-8  text-[2.6rem] leading-12 text-black font-primary"
          }
        >
          {t("edit")}
        </DialogTitle>
        <DialogDescription className={"sr-only"}>
          <span>Add Member</span>
        </DialogDescription>
      </DialogHeader>
      <form
        className={
          "flex flex-col w-auto justify-center items-center pt-12 gap-12"
        }
      >
        <div className={"w-full flex flex-col gap-6"}>
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
                      {Array.from({ length: 5 }).map((_, index) => {
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
            {isLoading ? <LoadingCircleSmall /> : t("edit")}
          </span>
        </DialogClose>
      </form>
    </DialogContent>
  );
}
