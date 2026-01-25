"use client";
import { ButtonPrimary } from "@/components/shared/buttons";
import { PasswordInput } from "@/components/shared/Inputs";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Link } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { signOut, useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

export default function ChangePasswordForm() {
  const t = useTranslations("Settings.security");
  const locale = useLocale();
  const { data: session } = useSession();

  const changePasswordSchema = z
    .object({
      currentPassword: z.string().min(1, t("errors.blank")),
      password: z.string().min(8, t("errors.password")),
      password_confirmation: z.string().min(8, t("errors.password")),
    })
    .refine((data) => data.password === data.password_confirmation, {
      path: ["password_confirmation"],
      message: t("errors.confirm"),
    });
  type TChangePasswordSchema = z.infer<typeof changePasswordSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema),
  });

  async function submitHandler(data: TChangePasswordSchema) {
    try {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/me/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept-Language": locale,
            origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
            Authorization: `Bearer ${session?.user.accessToken}`,
          },
          body: JSON.stringify(data),
        },
      );
      const response = await request.json();
      if (response.status === "success") {
        toast.success("Success");
        signOut();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error);
      toast.error("Something went wrong : " + errorMessage);
    }
  }
  return (
    <form
      onSubmit={handleSubmit(submitHandler)}
      className={"flex flex-col gap-8"}
    >
      <span
        className={"pb-4 font-medium text-[1.8rem] leading-10 text-deep-100"}
      >
        {t("subtitle")}
      </span>

      <PasswordInput
        {...register("currentPassword")}
        name="currentPassword"
        error={errors.currentPassword?.message}
        isLoading={isSubmitting}
      >
        {t("placeholders.password")}
      </PasswordInput>
      <PasswordInput
        {...register("password")}
        name="password"
        error={errors.password?.message}
        isLoading={isSubmitting}
      >
        {t("placeholders.new")}
      </PasswordInput>
      <PasswordInput
        {...register("password_confirmation")}
        name="password_confirmation"
        error={errors.password_confirmation?.message}
        isLoading={isSubmitting}
      >
        {t("placeholders.confirm")}
      </PasswordInput>

      <div className={"w-full flex justify-end"}>
        <Link
          href={`/auth/forgot-password`}
          className={
            "font-normal text-[1.5rem] leading-8 text-right text-primary-500 hover:text-primary-300 transition-all duration-300"
          }
        >
          {t("reset")}
        </Link>
      </div>
      <ButtonPrimary type="submit">
        {isSubmitting ? <LoadingCircleSmall /> : t("subtitle")}
      </ButtonPrimary>
    </form>
  );
}
