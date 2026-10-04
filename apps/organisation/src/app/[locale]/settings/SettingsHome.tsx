"use client";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import {
  CardPos,
  I24Support,
  Link21,
  MoneySend,
  Notification,
  Profile2User,
  SecuritySafe,
  Setting5,
  User,
} from "iconsax-reactjs";
import { SettingsCard } from "./parts";
import Signout from "./Signout";
import SwitchOrganisationMobile from "./SwitchOrganisationMobile";

/**
 * Settings home (Figma 1809:15286, phone 2226:68956): Figma's six cards, then
 * Subscriptions and Integrations (post-design). Phones add Help, Switch
 * organisation and Log out under the list.
 */
export default function SettingsHome({ helpUrl }: { helpUrl: string }) {
  const t = useTranslations("Settings");
  const links = [
    { label: t("account.title"), href: "/settings/account", Icon: Setting5 },
    { label: t("profile.title"), href: "/settings/profile", Icon: User },
    { label: t("team.title"), href: "/settings/team", Icon: Profile2User },
    {
      label: t("security.title"),
      href: "/settings/security",
      Icon: SecuritySafe,
    },
    { label: t("payment.title"), href: "/settings/payment", Icon: CardPos },
    {
      label: t("notification.title"),
      href: "/settings/notification",
      Icon: Notification,
    },
    {
      label: t("subscriptions.title"),
      href: "/settings/subscriptions",
      Icon: MoneySend,
    },
    {
      label: t("integrations.title"),
      href: "/settings/integrations",
      Icon: Link21,
    },
  ];
  return (
    <div className="flex flex-col gap-10 pb-16 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      <motion.h1
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="font-primary font-medium text-[2.2rem] lg:text-[2.6rem] leading-12 text-black"
      >
        {t("title")}
      </motion.h1>
      <ul className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {links.map((link, i) => (
          <SettingsCard key={link.href} index={i} {...link} />
        ))}
        <SettingsCard
          className="lg:hidden"
          index={links.length}
          Icon={I24Support}
          label={t("help")}
          href={helpUrl}
          external
        />
        <SwitchOrganisationMobile />
        <Signout />
      </ul>
    </div>
  );
}
