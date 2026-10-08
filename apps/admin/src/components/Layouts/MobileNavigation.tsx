"use client";
import { Link, usePathname } from "@/i18n/navigation";
import {
  Building,
  Calendar,
  Chart1,
  HamburgerMenu,
  Logout,
  Money,
  MoneyRecive,
  Setting2,
  Ticket,
  UserSquare,
} from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useAdminSocket } from "@/lib/AdminSocketContext";
import { useEffect } from "react";
import { SETTINGS_PATHS } from "./settingsLinks";

/**
 * Phone navigation: the three most used Figma links, and "More" with the rest
 * of the sidebar (Organizers, Tickets, Payments, Payouts, Settings, Log out).
 */
export default function MobileNavigation({ className }: { className?: string }) {
  const t = useTranslations("Layout.sidebar");
  const pathname = usePathname();
  const locale = useLocale();

  const { liveThreadBadge, contactBadge, clearLiveThreadBadge, clearContactBadge } =
    useAdminSocket();

  useEffect(() => {
    if (pathname.startsWith("/support")) clearLiveThreadBadge();
  }, [pathname, clearLiveThreadBadge]);

  useEffect(() => {
    if (pathname.startsWith("/contact")) clearContactBadge();
  }, [pathname, clearContactBadge]);

  const settingsBadge = liveThreadBadge + contactBadge;

  const primaryLinks = [
    { label: t("links.analytics"), path: "/analytics", Icon: Chart1 },
    { label: t("links.activities"), path: "/activities", Icon: Calendar },
    { label: t("links.attendees"), path: "/attendees", Icon: UserSquare },
  ];

  const moreLinks = [
    { label: t("links.organisations"), path: "/organisations", Icon: Building, badge: 0 },
    { label: t("links.tickets"), path: "/tickets", Icon: Ticket, badge: 0 },
    { label: t("links.payments"), path: "/payments", Icon: Money, badge: 0 },
    { label: t("links.payouts"), path: "/payouts", Icon: MoneyRecive, badge: 0 },
    { label: t("settings"), path: "/settings", Icon: Setting2, badge: settingsBadge },
  ];

  function isActive(path: string) {
    if (path === "/settings") return SETTINGS_PATHS.some((p) => pathname.startsWith(p));
    if (path === "/activities") {
      return pathname.startsWith(path) && !pathname.startsWith("/activities/revisions");
    }
    return pathname.startsWith(path);
  }

  const isMoreActive = moreLinks.some((l) => isActive(l.path));

  return (
    <nav className={cn("lg:hidden rounded-t-3xl px-6", className)}>
      <ul className="flex gap-4 justify-between w-full">
        {primaryLinks.map(({ label, path, Icon }) => (
          <li key={path}>
            <Link
              href={path}
              className={cn(
                "group flex flex-col items-center gap-1 text-[1.2rem] leading-6",
                isActive(path)
                  ? "font-semibold text-primary-500"
                  : "text-neutral-700 hover:text-primary-500",
              )}
            >
              <Icon
                size="22"
                variant="Bulk"
                className={cn(
                  "transition-all duration-300",
                  isActive(path)
                    ? "stroke-primary-500 fill-primary-500"
                    : "stroke-neutral-900 fill-neutral-900 group-hover:stroke-primary-500 group-hover:fill-primary-500",
                )}
              />
              <span>{label}</span>
            </Link>
          </li>
        ))}

        <li>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "group relative flex flex-col items-center gap-1 text-[1.2rem] leading-6 cursor-pointer",
                  isMoreActive ? "font-semibold text-primary-500" : "text-neutral-700 hover:text-primary-500",
                )}
              >
                {settingsBadge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[1.6rem] h-[1.6rem] rounded-full bg-failure text-white text-[1rem] font-bold flex items-center justify-center px-[3px] leading-none">
                    {settingsBadge > 9 ? "9+" : settingsBadge}
                  </span>
                )}
                <HamburgerMenu
                  size="22"
                  variant="Bulk"
                  className={cn(
                    "transition-all duration-300",
                    isMoreActive
                      ? "stroke-primary-500 fill-primary-500"
                      : "stroke-neutral-900 fill-neutral-900 group-hover:stroke-primary-500 group-hover:fill-primary-500",
                  )}
                />
                <span>{t("more")}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0 border-none shadow-none bg-none mx-4">
              <div className="bg-neutral-100 border border-neutral-200 p-4 mb-8 rounded-[1rem] shadow-xl flex flex-col gap-4">
                <span className="font-medium py-[5px] border-b border-neutral-200 text-[1.4rem] text-deep-100 leading-8">
                  {t("more")}
                </span>
                <ul className="flex flex-col gap-2">
                  {moreLinks.map(({ label, path, Icon, badge }) => (
                    <li key={path}>
                      <Link href={path} className="flex items-center gap-4 py-3">
                        <Icon
                          size="20"
                          variant="Bulk"
                          className={cn(
                            "transition-all duration-300",
                            isActive(path)
                              ? "stroke-primary-500 fill-primary-500"
                              : "stroke-neutral-900 fill-neutral-900",
                          )}
                        />
                        <span
                          className={cn(
                            "text-[1.4rem] leading-4 flex-1",
                            isActive(path) ? "text-primary-500" : "text-neutral-700",
                          )}
                        >
                          {label}
                        </span>
                        {badge > 0 && (
                          <span className="min-w-[1.8rem] h-[1.8rem] rounded-full bg-failure text-white text-[1rem] font-bold flex items-center justify-center px-1 leading-none">
                            {badge > 9 ? "9+" : badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                  <li className="bg-neutral-200 h-px w-full" aria-hidden />
                  <li>
                    <button
                      onClick={() =>
                        signOut({
                          redirect: true,
                          redirectTo: `${process.env.NEXT_PUBLIC_ADMIN_URL}/${locale}/auth/login`,
                        })
                      }
                      className="flex items-center gap-4 py-3 cursor-pointer"
                    >
                      <Logout size="20" color="#737c8a" variant="Bulk" />
                      <span className="text-[1.4rem] leading-4 text-neutral-700">
                        {t("logout")}
                      </span>
                    </button>
                  </li>
                </ul>
              </div>
            </PopoverContent>
          </Popover>
        </li>
      </ul>
    </nav>
  );
}
