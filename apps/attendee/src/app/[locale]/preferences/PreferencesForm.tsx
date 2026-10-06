"use client";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { UpdateUserPreferences } from "@/actions/userActions";
import { UserPreference } from "@ticketwaze/typescript-config";
import { useAutoSave } from "@/hooks/useAutoSave";
import SaveIndicator from "@/components/shared/SaveIndicator";
import {
  Checkbox,
  Radio,
  Row,
  Section,
  Toggle,
} from "@/components/settings/SettingRows";

/** The fields POST /users/me/preferences takes — always sent together. */
type Prefs = {
  interests: string[];
  upcomingEvents: boolean;
  newEventsPreferredCategories: boolean;
  newEventsFollowedOrganizer: boolean;
  currency: "HTG" | "USD";
  appLanguage: "en" | "fr";
};

const INTERESTS = [
  "musics",
  "theater",
  "arts",
  "sports",
  "business",
  "networking",
  "online",
  "rentals",
  "transport",
  "booking",
] as const;

/**
 * Figma "Preference": every control saves as it changes. One state for the
 * whole page, because the API replaces all preferences at once: each section
 * used to send the copy it was rendered with, so saving one undid another
 * (and the email toggles were overwritten by that copy before sending).
 * Saving goes through useAutoSave: quick clicks are grouped into one request,
 * one at a time, with a "Saving… / Saved" pill for slow connections.
 */
export default function PreferencesForm({
  userPreferences,
}: {
  userPreferences: UserPreference;
}) {
  const t = useTranslations("Preferences");
  const locale = useLocale();
  const { data: session, update } = useSession();
  const initial: Prefs = {
    interests: userPreferences.interests ?? [],
    upcomingEvents: Boolean(userPreferences.upcomingEvents),
    newEventsPreferredCategories: Boolean(
      userPreferences.newEventsPreferredCategories,
    ),
    newEventsFollowedOrganizer: Boolean(
      userPreferences.newEventsFollowedOrganizer,
    ),
    currency: userPreferences.currency === "USD" ? "USD" : "HTG",
    // Older rows can hold a raw browser header ("fr-FR,fr;q=0.9"), so read the
    // language by its prefix rather than an exact match.
    appLanguage: String(userPreferences.appLanguage ?? "")
      .toLowerCase()
      .startsWith("fr")
      ? "fr"
      : "en",
  };
  const {
    value: prefs,
    status,
    change,
    current,
  } = useAutoSave<Prefs>(
    initial,
    async (next) => {
      const response = await UpdateUserPreferences(
        session?.user.accessToken ?? "",
        next,
        locale,
      );
      return {
        ok: response.status === "success",
        message: response.message || response.error,
      };
    },
    {
      onError: (message) =>
        toast.error(message || t("saveError"), { id: "preferences-error" }),
    },
  );

  const save = (patch: Partial<Prefs>) =>
    change((previous) => ({ ...previous, ...patch }));

  function toggleInterest(value: string) {
    const { interests } = current();
    const has = interests.includes(value);
    if (has && interests.length === 1) {
      toast.error(t("interests.error"), { id: "preferences-min" });
      return;
    }
    save({
      interests: has
        ? interests.filter((i) => i !== value)
        : [...interests, value],
    });
  }

  async function setCurrency(currency: Prefs["currency"]) {
    if (currency === current().currency) return;
    if (await save({ currency })) {
      await update({
        ...session,
        user: {
          ...session?.user,
          userPreference: { ...session?.user.userPreference, currency },
        },
      });
    }
  }

  return (
    <div className="flex flex-col gap-16">
      <Section title={t("categories.title")} index={0}>
        {INTERESTS.map((value) => {
          const checked = prefs.interests.includes(value);
          return (
            <Row
              key={value}
              ariaChecked={checked}
              onClick={() => toggleInterest(value)}
            >
              <span className="text-[1.6rem] text-deep-100">
                {t(`interests.second.${value}`)}
              </span>
              <Checkbox checked={checked} />
            </Row>
          );
        })}
      </Section>

      <Section title={t("email.title")} index={1}>
        {(
          [
            ["upcomingEvents", t("email.upcoming")],
            ["newEventsPreferredCategories", t("email.preferred")],
            ["newEventsFollowedOrganizer", t("email.follow")],
          ] as const
        ).map(([key, label]) => (
          <Row
            key={key}
            role="switch"
            ariaChecked={prefs[key]}
            onClick={() => save({ [key]: !current()[key] })}
          >
            <span className="text-[1.6rem] leading-[2.2rem] text-deep-100 max-w-[28rem] lg:max-w-152">
              {label}
            </span>
            <Toggle on={prefs[key]} />
          </Row>
        ))}
      </Section>

      <Section title={t("user.currency")} index={2}>
        {(
          [
            ["HTG", "Gourdes"],
            ["USD", t("user.usd")],
          ] as const
        ).map(([value, label]) => (
          <Row
            key={value}
            role="radio"
            ariaChecked={prefs.currency === value}
            onClick={() => setCurrency(value)}
          >
            <span className="text-[1.6rem] text-deep-100">{label}</span>
            <Radio checked={prefs.currency === value} />
          </Row>
        ))}
      </Section>

      <div></div>
      <SaveIndicator status={status} />
    </div>
  );
}
