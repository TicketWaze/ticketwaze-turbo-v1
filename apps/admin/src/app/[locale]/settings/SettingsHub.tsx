"use client";
import { motion } from "motion/react";
import { ArrowRight2 } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAdminSocket } from "@/lib/AdminSocketContext";
import { SETTINGS_LINKS } from "@/components/Layouts/settingsLinks";
import { cardMotion } from "@/components/shared/motion";

/**
 * One card per tool behind Settings. Live chat and contact messages keep the
 * unread count they had in the old sidebar.
 */
export default function SettingsHub() {
  const t = useTranslations("Settings.cards");
  const { liveThreadBadge, contactBadge } = useAdminSocket();
  const counts = { liveThread: liveThreadBadge, contact: contactBadge };

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">
      {SETTINGS_LINKS.map(({ key, path, Icon, badge }, i) => {
        const count = badge ? counts[badge] : 0;
        return (
          <motion.li key={key} {...cardMotion(i)}>
            <Link
              href={path}
              className="group h-full flex items-start gap-6 rounded-[2rem] border border-neutral-100 bg-white p-8 transition-[border-color,box-shadow] duration-300 hover:border-primary-200 hover:shadow-[0px_5px_10px_0px_rgba(0,0,0,0.06)]"
            >
              <span className="w-[4.8rem] h-[4.8rem] rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                <Icon size="22" variant="Bulk" color="#E45B00" />
              </span>
              <span className="flex flex-col gap-2 flex-1 min-w-0">
                <span className="flex items-center gap-3">
                  <span className="font-primary font-medium text-[1.7rem] leading-9 text-deep-100">
                    {t(`${key}.title`)}
                  </span>
                  {count > 0 && (
                    <span className="min-w-[2rem] h-[2rem] rounded-full bg-failure text-white text-[1.1rem] font-bold flex items-center justify-center px-1 leading-none">
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </span>
                <span className="text-[1.4rem] leading-8 text-neutral-600">
                  {t(`${key}.description`)}
                </span>
              </span>
              <ArrowRight2
                size="18"
                color="#ABB0B9"
                className="self-center shrink-0 transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </motion.li>
        );
      })}
    </ul>
  );
}
