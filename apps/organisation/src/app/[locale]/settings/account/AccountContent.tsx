"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ExportSquare } from "iconsax-reactjs";
import { User, UserPreference } from "@ticketwaze/typescript-config";
import { Input } from "@/components/shared/Inputs";
import { ButtonPill } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UpdateAccount } from "@/actions/userActions";
import { cn } from "@/lib/utils";
import { SettingsColumn, SettingsHeader } from "../parts";

/**
 * Account (Figma 1820:46885 view / 1820:47523 edit): "Organizer Information"
 * — the login email (read-only), the contact phone and the app language —
 * shown read-only until Edit, saved with Save changes. Name and photo live in
 * the Ticketwaze profile, linked below.
 */
export default function AccountContent({
  user,
  preferences,
  profileUrl,
}: {
  user: User;
  preferences: UserPreference;
  profileUrl: string;
}) {
  const t = useTranslations("Settings.account");
  const locale = useLocale();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState(user.whatsappPhoneNumber ?? "");  const [language, setLanguage] = useState<"en" | "fr">(
    preferences.appLanguage === "en" ? "en" : "fr",
  );

  async function save() {
    setSaving(true);
    const result = await UpdateAccount(
      { whatsappPhoneNumber: phone.trim(), appLanguage: language },
      locale,
    );
    setSaving(false);
    if (result.status === "failed") {
      toast.error(result.message);
      return;
    }
    toast.success(t("saved"));
    setEditing(false);
    // A new language means a new locale in the URL.
    if (language !== locale) {
      window.location.href = `${process.env.NEXT_PUBLIC_ORGANISATION_URL}/${language}/settings/account`;
    }
  }

  return (
    <div className="flex flex-col gap-12 pb-16 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      <SettingsHeader
        title={t("title")}
        actions={
          editing ? (
            <>
              <ButtonPill onClick={() => setEditing(false)} disabled={saving}>
                {t("cancel")}
              </ButtonPill>
              <ButtonPill
                tone="primary"
                onClick={save}
                disabled={saving}
                className="min-w-[13rem]"
              >
                {saving ? <LoadingCircleSmall /> : t("save")}
              </ButtonPill>
            </>
          ) : (
            <ButtonPill
              tone="primary"
              onClick={() => setEditing(true)}
              className="px-8"
            >
              {t("edit")}
            </ButtonPill>
          )
        }
      />

      <SettingsColumn title={t("subtitle")}>
        <Input value={user.email} disabled readOnly>
          {t("placeholders.email")}
        </Input>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={!editing}
          inputMode="tel"
        >
          {t("placeholders.phone")}
        </Input>
        <Select
          value={language}
          onValueChange={(v) => setLanguage(v as "en" | "fr")}
          disabled={!editing}
        >
          <SelectTrigger
            className={cn(
              "w-full bg-neutral-100 rounded-[5rem] !h-[6rem] px-8 text-[1.5rem] border border-transparent focus:border-primary-500 shadow-none",
              !editing && "text-neutral-500",
            )}
          >
            <SelectValue placeholder={t("language.title")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem className="text-[1.5rem] py-3" value="en">
              English
            </SelectItem>
            <SelectItem className="text-[1.5rem] py-3" value="fr">
              Français
            </SelectItem>
          </SelectContent>
        </Select>
      </SettingsColumn>

      <motion.a
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full max-w-[54rem] mx-auto flex items-center justify-center gap-2 text-center text-[1.4rem] text-primary-500 hover:underline"
      >
        {t("profileLink")}
        <ExportSquare size="16" color="#E45B00" />
      </motion.a>
    </div>
  );
}
