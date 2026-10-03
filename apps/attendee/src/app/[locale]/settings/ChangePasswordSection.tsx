"use client";
import { ButtonPrimary } from "@/components/shared/buttons";
import { PasswordInput } from "@/components/shared/Inputs";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Link } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Warning2 } from "iconsax-reactjs";
import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

/**
 * Figma "Change Password" (Settings). Accounts made with Google have no
 * password yet, so they get "Add a Password" instead. Either way the API ends
 * every session afterwards, so `onDone` shows the success screen and signs
 * out.
 */
export default function ChangePasswordSection({
  hasPassword,
  onDone,
}: {
  hasPassword: boolean;
  onDone: (kind: "changed" | "added") => void;
}) {
  const t = useTranslations("Settings");
  const { data: session } = useSession();
  const locale = useLocale();

  const passwordRules = (field: z.ZodString) =>
    field
      .min(8, { message: t("password.errors.password") })
      .refine((p) => /[A-Z]/.test(p))
      .refine((p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p));

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.user.accessToken}`,
    "Accept-Language": locale,
    origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
  };

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
  const addForm = useForm<TAddPasswordSchema>({
    resolver: zodResolver(addPasswordSchema),
  });

  async function addPasswordSubmit(data: TAddPasswordSchema) {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/add-password`,
      { method: "POST", headers, body: JSON.stringify(data) },
    );
    const response = await request.json().catch(() => null);
    if (response?.status === "success") {
      onDone("added");
    } else {
      toast.error(response?.message ?? t("security.errors.generic"));
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
    })
    // Caught here so the request is never sent; it used to warn and send.
    .refine((d) => d.password !== d.currentPassword, {
      path: ["password"],
      message: t("errors.sameError"),
    });
  type TChangePasswordSchema = z.infer<typeof changePasswordSchema>;
  const changeForm = useForm<TChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema),
  });

  async function changePasswordSubmit(data: TChangePasswordSchema) {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me/change-password`,
      { method: "POST", headers, body: JSON.stringify(data) },
    );
    const response = await request.json().catch(() => null);
    if (response?.status === "success") {
      onDone("changed");
    } else if (response?.status === "same") {
      changeForm.setError("password", { message: t("errors.sameError") });
    } else {
      toast.error(response?.message ?? t("security.errors.generic"));
    }
  }

  const securityTip = (
    <div className="flex items-start gap-4 border p-4 rounded-2xl border-neutral-300">
      <Warning2 size="24" color="#737C8A" variant="Bulk" />
      <p className="text-[1.2rem] leading-8 text-neutral-800">
        {t("password.tips.description")}
      </p>
    </div>
  );

  if (!hasPassword) {
    const { register, handleSubmit, formState } = addForm;
    return (
      <form
        onSubmit={handleSubmit(addPasswordSubmit)}
        className="flex flex-col gap-8"
      >
        <div className="flex flex-col gap-2">
          <span className="font-medium text-[1.8rem] leading-10 text-deep-100">
            {t("addPassword.title")}
          </span>
          <p className="text-[1.4rem] leading-7 text-neutral-600">
            {t("addPassword.description")}
          </p>
        </div>
        <PasswordInput t={t} validate {...register("password")}>
          {t("placeholders.new")}
        </PasswordInput>
        <PasswordInput
          {...register("password_confirmation")}
          error={formState.errors.password_confirmation?.message}
        >
          {t("placeholders.confirm")}
        </PasswordInput>
        {securityTip}
        <ButtonPrimary type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? (
            <LoadingCircleSmall />
          ) : (
            t("addPassword.cta")
          )}
        </ButtonPrimary>
      </form>
    );
  }

  const { register, handleSubmit, formState } = changeForm;
  return (
    <form
      onSubmit={handleSubmit(changePasswordSubmit)}
      className="flex flex-col gap-8"
    >
      <span className="font-medium text-[1.8rem] leading-10 text-deep-100">
        {t("password.title")}
      </span>
      <PasswordInput
        {...register("currentPassword")}
        autoComplete="current-password"
        error={formState.errors.currentPassword?.message}
      >
        {t("placeholders.password")}
      </PasswordInput>
      <PasswordInput
        t={t}
        validate
        autoComplete="new-password"
        {...register("password")}
        error={formState.errors.password?.message}
      >
        {t("placeholders.new")}
      </PasswordInput>
      <PasswordInput
        {...register("password_confirmation")}
        autoComplete="new-password"
        error={formState.errors.password_confirmation?.message}
      >
        {t("placeholders.confirm")}
      </PasswordInput>
      <Link
        className="self-end text-[1.5rem] leading-8 text-primary-500 hover:underline"
        href={"/auth/forgot-password"}
      >
        {t("forgot")}
      </Link>
      {securityTip}
      <ButtonPrimary type="submit" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? <LoadingCircleSmall /> : t("password.cta")}
      </ButtonPrimary>
    </form>
  );
}

/** Ends the session once the API has revoked its tokens. */
export function signOutAfterPasswordChange() {
  return signOut({
    redirect: true,
    redirectTo: `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/auth/login`,
  });
}
