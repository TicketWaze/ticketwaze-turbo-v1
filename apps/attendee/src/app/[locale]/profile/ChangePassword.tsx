"use client";
import { ButtonPrimary } from "@/components/shared/buttons";
import { PasswordInput } from "@/components/shared/Inputs";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { zodResolver } from "@hookform/resolvers/zod";
import { Warning2 } from "iconsax-reactjs";
import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

export default function ChangePassword() {
  const t = useTranslations("Settings");
  const { data: session } = useSession();
  const changePasswordSchema = z
    .object({
      currentPassword: z.string().min(1, t("password.errors.blank")),
      // password: z.string().min(8, t("password.errors.password")),
      password: z
        .string()
        .min(8, { message: t("password.errors.password") })
        .refine((password) => /[A-Z]/.test(password))
        .refine((password) =>
          /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
        ),
      password_confirmation: z.string(),
    })
    .refine((data) => data.password === data.password_confirmation, {
      path: ["password_confirmation"],
      message: t("password.errors.confirm"),
    });
  type TChangePasswordSchema = z.infer<typeof changePasswordSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema),
  });
  const locale = useLocale();
  async function submitHandler(data: TChangePasswordSchema) {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me/change-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user.accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_APP_URL!,
        },
        body: JSON.stringify(data),
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      toast.success("Password Updated");
      signOut({
        redirect: true,
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`,
      });
    } else {
      toast.error(response.message);
    }
  }
  return (
    <form
      onSubmit={handleSubmit(submitHandler)}
      className="flex flex-col gap-12"
    >
      <span className="font-medium text-[1.8rem] leading-[25px] text-deep-100">
        {t("password.title")}
      </span>
      <div className="flex flex-col gap-8">
        <PasswordInput
          {...register("currentPassword")}
          error={errors.currentPassword?.message}
        >
          {t("placeholders.password")}
        </PasswordInput>
        <PasswordInput
          t={t}
          validate
          {...register("password")}
          // error={errors.password?.message}
        >
          {t("placeholders.new")}
        </PasswordInput>
        <PasswordInput
          {...register("password_confirmation")}
          error={errors.password_confirmation?.message}
        >
          {t("placeholders.confirm")}
        </PasswordInput>
        <div className="flex items-start gap-4 border p-4 rounded-2xl border-neutral-300">
          <Warning2 size="24" color="#737C8A" variant="Bulk" />
          <div>
            <span className="text-[1.2rem] leading-8 text-neutral-900">
              {t("password.tips.title")}
            </span>
            <p className="text-[1.2rem] leading-8 text-neutral-800">
              {t("password.tips.description")}
            </p>
          </div>
        </div>
      </div>
      <ButtonPrimary type="submit" disabled={isSubmitting}>
        {isSubmitting ? <LoadingCircleSmall /> : t("password.cta")}
      </ButtonPrimary>
    </form>
  );
}
