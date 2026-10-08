"use client";
import { useEffect, useState } from "react";
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
 * Factor Authentication, read-only here: it turns on by itself once the user
 * belongs to a KYC-approved organisation (GET /users/me/mfa says why), and
 * users can also turn it on for themselves from the attendee settings.
 * A changed password ends every session, so the success screen signs out.
 */
export default function SecurityContent() {
  const t = useTranslations("Settings.security");
  // The password rule checklist (8 characters, a capital, a special one).
  const tRegister = useTranslations("Auth.register");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const [done, setDone] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [mfa, setMfa] = useState<{
    mfaActive: boolean;
    mfaRequired: boolean;
  } | null>(null);

  const accessToken = session?.user.accessToken;
  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/mfa`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": locale,
      },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.status === "success") {
          setMfa({ mfaActive: data.mfaActive, mfaRequired: data.mfaRequired });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [accessToken, locale]);
  const mfaTip = !mfa
    ? null
    : session?.user.hasPassword === false
      ? t("tip_no_password")
      : mfa.mfaRequired
      ? t("tip_required", { email: session?.user.email ?? "" })
      : mfa.mfaActive
        ? t("tip_personal")
        : t("tip_off");

  // Accounts made with Google have no password: they create one (no current
  // password to type) instead of changing it. Read from the session, which a
  // password change or reset always ends, so it can't go stale.
  const addMode = session?.user.hasPassword === false;

  const schema = z
    .object({
      currentPassword: addMode
        ? z.string().optional()
        : z.string().min(1, t("errors.blank")),
      // Same rules as POST /auth/add-password and the sign-up form.
      password: addMode
        ? z
            .string()
            .min(8, t("errors.password"))
            .refine((p) => /[A-Z]/.test(p))
            .refine((p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p))
        : z.string().min(8, t("errors.password")),
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
    (addMode || filled.currentPassword) &&
      filled.password &&
      filled.password_confirmation,
  );

  async function submit(data: Values) {
    const request = await fetch(
      addMode
        ? `${process.env.NEXT_PUBLIC_API_URL}/auth/add-password`
        : `${process.env.NEXT_PUBLIC_API_URL}/users/me/change-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
          Authorization: `Bearer ${session?.user.accessToken}`,
        },
        body: JSON.stringify(
          addMode
            ? {
                password: data.password,
                password_confirmation: data.password_confirmation,
              }
            : data,
        ),
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
        title={addMode ? t("added_title") : t("changed_title")}
        description={
          addMode ? t("added_description") : t("changed_description")
        }
        pendingLabel={t("signing_out")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-12 pb-16 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      <PageLoader isLoading={leaving} />
      <SettingsHeader title={t("title")} />

      <SettingsColumn title={addMode ? t("add_title") : t("subtitle")}>
        <form
          onSubmit={handleSubmit(submit)}
          className="flex flex-col gap-6"
          noValidate
        >
          {addMode ? (
            <p className="text-[1.4rem] leading-7 text-neutral-600">
              {t("add_description")}
            </p>
          ) : (
            <PasswordInput
              {...register("currentPassword")}
              name="currentPassword"
              autoComplete="current-password"
              error={errors.currentPassword?.message}
              isLoading={isSubmitting}
            >
              {t("placeholders.password")}
            </PasswordInput>
          )}
          {addMode ? (
            <PasswordInput
              {...register("password")}
              name="password"
              autoComplete="new-password"
              t={tRegister}
              validate
              isLoading={isSubmitting}
            >
              {t("placeholders.new")}
            </PasswordInput>
          ) : (
            <PasswordInput
              {...register("password")}
              name="password"
              autoComplete="new-password"
              error={errors.password?.message}
              isLoading={isSubmitting}
            >
              {t("placeholders.new")}
            </PasswordInput>
          )}
          <PasswordInput
            {...register("password_confirmation")}
            name="password_confirmation"
            error={errors.password_confirmation?.message}
            isLoading={isSubmitting}
          >
            {t("placeholders.confirm")}
          </PasswordInput>
          {!addMode && (
            <button
              type="button"
              onClick={resetPassword}
              className="self-end text-[1.4rem] text-primary-500 cursor-pointer hover:underline"
            >
              {t("reset")}
            </button>
          )}
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
            {isSubmitting ? (
              <LoadingCircleSmall />
            ) : addMode ? (
              t("add_cta")
            ) : (
              t("change")
            )}
          </motion.button>
        </form>
      </SettingsColumn>

      <SettingsColumn title={t("two_factor")} delay={0.14}>
        <div className="flex items-center justify-between gap-6">
          <span className="text-[1.5rem] text-deep-100">{t("enable")}</span>
          <SettingsSwitch
            checked={mfa?.mfaActive ?? false}
            disabled
            label={t("two_factor")}
          />
        </div>
        {mfaTip && (
          <p className="flex items-start gap-3 text-[1.2rem] leading-6 text-neutral-600">
            <Warning2
              size="16"
              variant="Bulk"
              color="#737C8A"
              className="shrink-0 mt-[.1rem]"
            />
            {mfaTip}
          </p>
        )}
      </SettingsColumn>
    </div>
  );
}
