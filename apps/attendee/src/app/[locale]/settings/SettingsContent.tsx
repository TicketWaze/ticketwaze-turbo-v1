"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ExportSquare } from "iconsax-reactjs";
import { usePathname } from "@/i18n/navigation";
import { UpdateUserPreferences } from "@/actions/userActions";
import { UserPreference } from "@ticketwaze/typescript-config";
import { Radio, Row, Section } from "@/components/settings/SettingRows";
import successBadge from "@/assets/images/auth/success-badge.png";
import ChangePasswordSection, {
  signOutAfterPasswordChange,
} from "./ChangePasswordSection";
import TwoFactorSection from "./TwoFactorSection";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Figma "Settings": Change Password, Security (2FA), App Language, Others.
 * The Figma "Payment · Saved card" block is left out — cards are not stored.
 */
export default function SettingsContent({
  hasPassword,
  mfaEnabled,
  preferences,
}: {
  hasPassword: boolean;
  mfaEnabled: boolean;
  preferences: UserPreference;
}) {
  const t = useTranslations("Settings");
  const locale = useLocale();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [done, setDone] = useState<"changed" | "added" | null>(null);
  const [language, setLanguage] = useState(
    // By prefix: older rows can hold a raw header like "fr-FR,fr;q=0.9".
    String(preferences.appLanguage ?? "")
      .toLowerCase()
      .startsWith("fr")
      ? "fr"
      : "en",
  );

  // The API ended every session with the password change; show Figma's
  // success screen for a moment, then sign out.
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => void signOutAfterPasswordChange(), 2500);
    return () => clearTimeout(id);
  }, [done]);

  async function changeLanguage(next: "en" | "fr") {
    if (next === language) return;
    const previous = language;
    setLanguage(next);
    const response = await UpdateUserPreferences(
      session?.user.accessToken ?? "",
      {
        interests: preferences.interests,
        upcomingEvents: preferences.upcomingEvents,
        newEventsPreferredCategories: preferences.newEventsPreferredCategories,
        newEventsFollowedOrganizer: preferences.newEventsFollowedOrganizer,
        currency: preferences.currency,
        appLanguage: next,
      },
      locale,
    );
    if (response.status !== "success") {
      setLanguage(previous);
      toast.error(response.message || t("security.errors.generic"));
      return;
    }
    window.location.assign(
      `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${next}${pathname}`,
    );
  }

  const legals = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/${locale}/legals`;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {done ? (
        <motion.div
          key="done"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease }}
          className="flex-1 flex flex-col items-center justify-center gap-8 text-center py-24"
          role="status"
        >
          <motion.div
            initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <Image
              src={successBadge}
              alt=""
              width={150}
              height={150}
              className="w-[15rem] h-[15rem]"
            />
          </motion.div>
          <div className="flex flex-col gap-4">
            <h2 className="font-primary font-medium text-[2.6rem] leading-12 text-black">
              {done === "added" ? t("addPassword.success") : t("done.title")}
            </h2>
            <p className="text-[1.6rem] leading-10 text-neutral-600">
              {t("done.description")}
            </p>
          </div>
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="text-[1.6rem] text-primary-500"
          >
            {t("done.signingOut")}
          </motion.span>
        </motion.div>
      ) : (
        <motion.div
          key="settings"
          exit={{ opacity: 0, y: -12 }}
          className="flex flex-col gap-16"
        >
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
          >
            <ChangePasswordSection hasPassword={hasPassword} onDone={setDone} />
          </motion.section>

          <TwoFactorSection
            initialEnabled={mfaEnabled}
            hasPassword={hasPassword}
            index={1}
          />

          <Section title={t("language.title")} index={2}>
            {(
              [
                ["en", "English"],
                ["fr", "Français"],
              ] as const
            ).map(([value, label]) => (
              <Row
                key={value}
                role="radio"
                ariaChecked={language === value}
                onClick={() => changeLanguage(value)}
              >
                <span className="text-[1.6rem] text-deep-100">{label}</span>
                <Radio checked={language === value} />
              </Row>
            ))}
          </Section>

          <Section title={t("others.title")} index={3}>
            {(
              [
                ["privacy", t("others.privacy")],
                ["terms", t("others.terms")],
              ] as const
            ).map(([key, label]) => (
              <a
                key={key}
                href={legals}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between gap-6 py-6 group"
              >
                <span className="text-[1.6rem] text-deep-100">{label}</span>
                <span className="w-12 h-12 rounded-[0.6rem] bg-primary-100 flex items-center justify-center transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                  <ExportSquare size={18} color="#E45B00" variant="Bulk" />
                </span>
              </a>
            ))}
          </Section>
          <div></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
