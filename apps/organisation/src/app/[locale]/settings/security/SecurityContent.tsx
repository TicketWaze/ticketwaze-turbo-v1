"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "motion/react";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { Warning2 } from "iconsax-reactjs";
import { PasswordInput } from "@/components/shared/Inputs";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import PageLoader from "@/components/PageLoader";
import { CreatedScreen } from "@/components/create/CreateParts";
import { useRouter } from "@/i18n/navigation";
import { SettingsColumn, SettingsHeader, SettingsSwitch } from "../parts";

/**
 * Security (Figma 1828:48591 / 1831:48834 / 1832:49044): Change Password —
 * current, new and confirm (kept by request), "Reset password" — then Two
 * Factor Authentication, which organisation accounts cannot switch off.
 * A changed password ends every session, so the success screen signs out.
 */
export default function SecurityContent() {
  const t = useTranslations("Settings.security");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const [done, setDone] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const schema = z
    .object({
      currentPassword: z.string().min(1, t("errors.blank")),
      password: z.string().min(8, t("errors.password")),
      password_confirmation: z.string().min(8, t("errors.password")),
    })
    .refine((d) => d.password === d.password_confirmation, {
      path: ["password_confirmation"],
      message: t("errors.confirm"),
    });
  type Values = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });
  const filled = useWatch({ control });
  const ready = Boolean(
    filled.currentPassword && filled.password && filled.password_confirmation,
  );

  async function submit(data: Values) {
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
    ).catch(() => null);
    const response = await request?.json().catch(() => null);
    if (response?.status === "success") {
      setDone(true);
      setTimeout(() => void signOut(), 2200);
      return;
    }
    toast.error(response?.message ?? t("errors.failed"));
  }

  async function resetPassword() {
    setLeaving(true);
    await signOut({ redirect: false });
    router.push(
      `/auth/forgot-password?email=${encodeURIComponent(session?.user.email ?? "")}`,
    );
  }

  if (done) {
    return (
      <CreatedScreen
        title={t("changed_title")}
        description={t("changed_description")}
        pendingLabel={t("signing_out")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-12 pb-16 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      <PageLoader isLoading={leaving} />
      <SettingsHeader title={t("title")} />

      <SettingsColumn title={t("subtitle")}>
        <form
          onSubmit={handleSubmit(submit)}
          className="flex flex-col gap-6"
          noValidate
        >
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
          <button
            type="button"
            onClick={resetPassword}
            className="self-end text-[1.4rem] text-primary-500 cursor-pointer hover:underline"
          >
            {t("reset")}
          </button>
          <p className="flex items-start gap-3 text-[1.2rem] leading-6 text-neutral-600">
            <Warning2
              size="16"
              variant="Bulk"
              color="#737C8A"
              className="shrink-0 mt-[.1rem]"
            />
            {t("passwordTip")}
          </p>
          <motion.button
            type="submit"
            whileTap={ready ? { scale: 0.98 } : undefined}
            disabled={!ready || isSubmitting}
            className="w-full h-[5.2rem] rounded-[10rem] bg-primary-500 font-sans font-semibold text-[1.5rem] text-white cursor-pointer transition-[background-color,opacity] hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? <LoadingCircleSmall /> : t("change")}
          </motion.button>
        </form>
      </SettingsColumn>

      <SettingsColumn title={t("two_factor")} delay={0.14}>
        <div className="flex items-center justify-between gap-6">
          <span className="text-[1.5rem] text-deep-100">{t("enable")}</span>
          <SettingsSwitch checked disabled label={t("two_factor")} />
        </div>
        <p className="flex items-start gap-3 text-[1.2rem] leading-6 text-neutral-600">
          <Warning2
            size="16"
            variant="Bulk"
            color="#737C8A"
            className="shrink-0 mt-[.1rem]"
          />
          {t("2faTip")}
        </p>
      </SettingsColumn>
    </div>
  );
}
