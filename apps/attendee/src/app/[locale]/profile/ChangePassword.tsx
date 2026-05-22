"use client";
import { ButtonPrimary } from "@/components/shared/buttons";
import { PasswordInput } from "@/components/shared/Inputs";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Link } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Warning2 } from "iconsax-reactjs";
import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { User } from "@ticketwaze/typescript-config";
import * as z from "zod";

export default function ChangePassword({ user }: { user: User }) {
  const t = useTranslations("Settings");
  const { data: session } = useSession();
  const locale = useLocale();
  const [hasPassword, setHasPassword] = useState(user.hasPassword);

  const passwordRules = (field: z.ZodString) =>
    field
      .min(8, { message: t("password.errors.password") })
      .refine((p) => /[A-Z]/.test(p))
      .refine((p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p));

  // ── Add Password ────────────────────────────────────────────────────────────
  const addPasswordSchema = z
    .object({
      password: passwordRules(z.string()),
      password_confirmation: z.string(),
    })
    .refine((d) => d.password === d.password_confirmation, {
      path: ["password_confirmation"],
      message: t("password.errors.confirm"),
    });
  type TAddPasswordSchema = z.infer<typeof addPasswordSchema>;

  const {
    register: registerAdd,
    handleSubmit: handleAdd,
    formState: { errors: addErrors, isSubmitting: isAdding },
  } = useForm<TAddPasswordSchema>({ resolver: zodResolver(addPasswordSchema) });

  async function addPasswordSubmit(data: TAddPasswordSchema) {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/add-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user.accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
        body: JSON.stringify(data),
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      toast.success(t("addPassword.success"));
      setHasPassword(true);
      signOut({
        redirect: true,
        redirectTo: `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/auth/login`,
      });
    } else {
      toast.error(response.message);
    }
  }

  // ── Change Password ─────────────────────────────────────────────────────────
  const changePasswordSchema = z
    .object({
      currentPassword: z.string().min(1, t("password.errors.blank")),
      password: passwordRules(z.string()),
      password_confirmation: z.string(),
    })
    .refine((d) => d.password === d.password_confirmation, {
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

  async function changePasswordSubmit(data: TChangePasswordSchema) {
    if (data.currentPassword === data.password) {
      toast.error(t("errors.sameError"));
    }
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me/change-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user.accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
        body: JSON.stringify(data),
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      toast.success("Password Updated");
      signOut({
        redirect: true,
        redirectTo: `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/auth/login`,
      });
    } else if (response.status === "same") {
      toast.error(t("errors.sameError"));
    } else {
      toast.error(response.message);
    }
  }

  const securityTip = (
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
  );

  if (!hasPassword) {
    return (
      <form
        onSubmit={handleAdd(addPasswordSubmit)}
        className="flex flex-col gap-12"
      >
        <div className="flex flex-col gap-4">
          <span className="font-medium text-[1.8rem] leading-10 text-deep-100">
            {t("addPassword.title")}
          </span>
          <p className="text-[1.4rem] leading-7 text-neutral-600">
            {t("addPassword.description")}
          </p>
        </div>
        <div className="flex flex-col gap-8">
          <PasswordInput t={t} validate {...registerAdd("password")}>
            {t("placeholders.new")}
          </PasswordInput>
          <PasswordInput
            {...registerAdd("password_confirmation")}
            error={addErrors.password_confirmation?.message}
          >
            {t("placeholders.confirm")}
          </PasswordInput>
          {securityTip}
        </div>
        <ButtonPrimary type="submit" disabled={isAdding}>
          {isAdding ? <LoadingCircleSmall /> : t("addPassword.cta")}
        </ButtonPrimary>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(changePasswordSubmit)}
      className="flex flex-col gap-12"
    >
      <span className="font-medium text-[1.8rem] leading-10 text-deep-100">
        {t("password.title")}
      </span>
      <div className="flex flex-col gap-8">
        <PasswordInput
          {...register("currentPassword")}
          error={errors.currentPassword?.message}
        >
          {t("placeholders.password")}
        </PasswordInput>
        <PasswordInput t={t} validate {...register("password")}>
          {t("placeholders.new")}
        </PasswordInput>
        <PasswordInput
          {...register("password_confirmation")}
          error={errors.password_confirmation?.message}
        >
          {t("placeholders.confirm")}
        </PasswordInput>
        <div className="flex items-center justify-between">
          <span></span>
          <Link
            className="text-[1.5rem] leading-8 text-primary-500"
            href={"/auth/forgot-password"}
          >
            {t("forgot")}
          </Link>
        </div>
        {securityTip}
      </div>
      <ButtonPrimary type="submit" disabled={isSubmitting}>
        {isSubmitting ? <LoadingCircleSmall /> : t("password.cta")}
      </ButtonPrimary>
    </form>
  );
}
