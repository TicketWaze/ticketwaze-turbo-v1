"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Link, usePathname } from "@/i18n/navigation";
import {
  Building,
  Clock,
  HamburgerMenu,
  I24Support,
  LoginCurve,
  Logout,
  MoneyRecive,
  Setting2,
  Setting5,
  Star,
  Ticket,
  User,
} from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import { signOut, useSession } from "next-auth/react";
import { authHref } from "@/lib/authRedirect";
import { useAuthInterceptor } from "@/hooks/useAuthInterceptor";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

type NavIcon = typeof Ticket;

/**
 * Figma "Nav": the phone tab bar — Explore · Upcoming · Profile · More — and
 * the More menu (History, Organisations, Preference, Settings, then Help and
 * Log out). Wallet is not in Figma but is a real page, so it joins the menu.
 * Signed out, More becomes "Log in": everything in it needs an account.
 */
export default function MobileNavigation({
  className,
}: {
  className?: string;
}) {
  const t = useTranslations("Layout.sidebar");
  const pathname = usePathname();
  useAuthInterceptor();
  const locale = useLocale();
  const { status } = useSession();
  // "loading" counts as neither, so a signed-in user never sees Log in flash.
  const isSignedOut = status === "unauthenticated";
  const [moreOpen, setMoreOpen] = useState(false);

  const tabs: { label: string; path: string; Icon: NavIcon }[] = [
    { label: t("links.explore"), path: "/explore", Icon: Ticket },
    { label: t("links.upcoming"), path: "/upcoming", Icon: Star },
    { label: t("links.profile"), path: "/profile", Icon: User },
  ];
  const moreLinks: { label: string; path: string; Icon: NavIcon }[] = [
    { label: t("links.history"), path: "/history", Icon: Clock },
    { label: t("links.organizers"), path: "/organisations", Icon: Building },
    { label: t("links.wallet"), path: "/wallet", Icon: MoneyRecive },
    { label: t("links.preferences"), path: "/preferences", Icon: Setting5 },
    { label: t("links.settings"), path: "/settings", Icon: Setting2 },
  ];

  const isActive = (path: string) => pathname.startsWith(path);
  // The More tab lights up whenever the current page lives in its menu.
  const moreActive = moreLinks.some(({ path }) => isActive(path));

  return (
    <nav
      className={cn(
        "fixed bottom-0 inset-x-0 z-50 lg:hidden rounded-t-3xl px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] bg-neutral-200",
        className,
      )}
    >
      <ul className="flex gap-4 justify-between w-full">
        {tabs.map(({ label, path, Icon }) => (
          <li key={path}>
            <Link href={path} className="group flex flex-col items-center">
              <TabItem label={label} Icon={Icon} active={isActive(path)} />
            </Link>
          </li>
        ))}
        {isSignedOut ? (
          <li>
            {/* Back to the page they were on once signed in. */}
            <Link
              href={authHref("/auth/login", pathname)}
              className="group font-semibold text-[1.5rem] leading-8 text-primary-500 flex flex-col items-center gap-4"
            >
              <LoginCurve size="20" color="#E45B00" variant="Bulk" />
              <span>{t("login")}</span>
            </Link>
          </li>
        ) : (
          <li>
            <Popover open={moreOpen} onOpenChange={setMoreOpen}>
              <PopoverTrigger
                aria-label={t("more")}
                className="group flex flex-col items-center cursor-pointer"
              >
                <TabItem
                  label={t("more")}
                  Icon={HamburgerMenu}
                  active={moreActive || moreOpen}
                />
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="end"
                sideOffset={16}
                className="w-[22rem] p-[10px] bg-white border border-neutral-100 rounded-[10px] shadow-[0px_5px_10px_0px_rgba(0,0,0,0.1)]"
              >
                <span className="block px-[10px] pt-[2px] pb-[8px] mb-1 border-b border-neutral-100 text-[1.4rem] font-medium leading-8 text-deep-100">
                  {t("more")}
                </span>
                <ul className="flex flex-col">
                  {moreLinks.map(({ Icon, label, path }, index) => (
                    <MenuItem key={path} index={index}>
                      <Link
                        href={path}
                        onClick={() => setMoreOpen(false)}
                        aria-current={isActive(path) ? "page" : undefined}
                        className="flex items-center gap-4 px-[10px] py-[10px] rounded-[7.5px] hover:bg-neutral-100 transition-colors"
                      >
                        <Icon
                          size="20"
                          variant="Bulk"
                          color={isActive(path) ? "#E45B00" : "#737C8A"}
                        />
                        <span
                          className={`text-[1.5rem] leading-8 ${isActive(path) ? "text-primary-500 font-medium" : "text-neutral-700"}`}
                        >
                          {label}
                        </span>
                      </Link>
                    </MenuItem>
                  ))}
                  <li className="my-2 mx-[10px] h-px bg-neutral-100" />
                  <MenuItem index={moreLinks.length}>
                    <Link
                      target="_blank"
                      href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/${locale}/contact`}
                      onClick={() => setMoreOpen(false)}
                      className="flex items-center gap-4 px-[10px] py-[10px] rounded-[7.5px] hover:bg-neutral-100 transition-colors"
                    >
                      <I24Support size="20" color="#737C8A" variant="Bulk" />
                      <span className="text-[1.5rem] leading-8 text-neutral-700">
                        {t("help")}
                      </span>
                    </Link>
                  </MenuItem>
                  <MenuItem index={moreLinks.length + 1}>
                    <button
                      onClick={() =>
                        signOut({
                          redirect: true,
                          redirectTo: process.env.NEXT_PUBLIC_ATTENDEE_URL,
                        })
                      }
                      className="w-full flex items-center gap-4 px-[10px] py-[10px] rounded-[7.5px] hover:bg-neutral-100 transition-colors cursor-pointer"
                    >
                      <Logout size="20" color="#737c8a" variant="Bulk" />
                      <span className="text-[1.5rem] leading-8 text-neutral-700">
                        {t("logout")}
                      </span>
                    </button>
                  </MenuItem>
                </ul>
              </PopoverContent>
            </Popover>
          </li>
        )}
      </ul>
    </nav>
  );
}

function TabItem({
  label,
  Icon,
  active,
}: {
  label: string;
  Icon: NavIcon;
  active: boolean;
}) {
  return (
    <span
      className={`flex flex-col items-center gap-4 text-[1.5rem] leading-8 transition-colors ${active ? "font-semibold text-primary-500" : "font-normal text-neutral-700 group-hover:text-primary-500"}`}
    >
      <motion.span
        animate={{ scale: active ? 1.12 : 1, y: active ? -1 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
        className="flex"
      >
        <Icon size="20" variant="Bulk" color={active ? "#E45B00" : "#2E3237"} />
      </motion.span>
      <span>{label}</span>
    </span>
  );
}

/** Menu rows slide in one after another as the menu opens. */
function MenuItem({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      {children}
    </motion.li>
  );
}
