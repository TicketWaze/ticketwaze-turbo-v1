"use client";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { NotificationPreference } from "@ticketwaze/typescript-config";
import { UpdateOrganisationNotificationPreferences } from "@/actions/organisationActions";
import { SettingsColumn, SettingsHeader, SettingsSwitch } from "../parts";
import { useAutoSave } from "@/hooks/useAutoSave";
import SaveIndicator from "@/components/shared/SaveIndicator";

type Key =
  | "emailTicketSalesUpdate"
  | "emailPaymentUpdates"
  | "emailPlatformAnnouncements";

/**
 * Notification (not designed — built from the Settings kit): the three email
 * preferences as switches. Saved through useAutoSave: quick changes are
 * grouped into one request, one at a time, with a "Saving… / Saved" pill, and
 * a failure puts back what the server last confirmed.
 */
export default function NotificationForm({
  notificationPreferences,
}: {
  notificationPreferences: NotificationPreference;
}) {
  const t = useTranslations("Settings.notification");
  const locale = useLocale();
  const { data: session } = useSession();
  const {
    value: prefs,
    status,
    change,
  } = useAutoSave<Record<Key, boolean>>(
    {
      emailTicketSalesUpdate: Boolean(
        notificationPreferences.emailTicketSalesUpdate,
      ),
      emailPaymentUpdates: Boolean(notificationPreferences.emailPaymentUpdates),
      emailPlatformAnnouncements: Boolean(
        notificationPreferences.emailPlatformAnnouncements,
      ),
    },
    async (next) => {
      const result = await UpdateOrganisationNotificationPreferences(
        session?.activeOrganisation?.organisationId ?? "",
        next,
        locale,
      );
      return { ok: !result.error, message: result.error };
    },
    {
      onError: (message) =>
        toast.error(message || t("error"), { id: "notification-error" }),
    },
  );

  function toggle(key: Key, next: boolean) {
    void change((previous) => ({ ...previous, [key]: next }));
  }

  const items: { key: Key; label: string }[] = [
    { key: "emailTicketSalesUpdate", label: t("ticket_sales") },
    { key: "emailPaymentUpdates", label: t("payment_update") },
    { key: "emailPlatformAnnouncements", label: t("platform") },
  ];

  return (
    <div className="flex flex-col gap-12 pb-16 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      <SettingsHeader title={t("title")} />
      <SettingsColumn title={t("email")}>
        <div className="flex flex-col divide-y divide-neutral-100 rounded-[1.5rem] border border-neutral-100 px-6">
          {items.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="flex items-center justify-between gap-6 py-6"
            >
              <span className="text-[1.5rem] leading-[2.2rem] text-deep-100">
                {item.label}
              </span>
              <SettingsSwitch
                checked={prefs[item.key]}
                onChange={(next) => toggle(item.key, next)}
                label={item.label}
              />
            </motion.div>
          ))}
        </div>
      </SettingsColumn>
      <SaveIndicator status={status} />
    </div>
  );
}
