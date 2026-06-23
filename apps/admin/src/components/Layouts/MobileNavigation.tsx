"use client";
import { Link, usePathname } from "@/i18n/navigation";
import {
  Building,
  Calendar,
  Chart1,
  HamburgerMenu,
  Headphone,
  Logout,
  Message,
  Money,
  MoneyRecive,
  MoneySend,
  Note,
  SecurityUser,
  Ticket,
  UserSquare,
} from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useAdminSocket } from "@/lib/AdminSocketContext";
import { useEffect } from "react";

export default function MobileNavigation({
  className,
}: {
  className?: string;
}) {
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

  const primaryLinks = [
    { label: t("links.analytics"), path: "/analytics", Icon: Chart1 },
    { label: t("links.activities"), path: "/activities", Icon: Calendar },
    { label: t("links.waitlist"), path: "/waitlist", Icon: Note },
  ];

  const moreLinks = [
    { label: t("links.attendees"), path: "/attendees", Icon: UserSquare, badge: 0 },
    { label: t("links.organisations"), path: "/organisations", Icon: Building, badge: 0 },
    { label: t("links.admins"), path: "/admins", Icon: SecurityUser, badge: 0 },
    { label: t("links.tickets"), path: "/tickets", Icon: Ticket, badge: 0 },
    { label: t("links.payments"), path: "/payments", Icon: Money, badge: 0 },
    { label: t("links.payouts"), path: "/payouts", Icon: MoneyRecive, badge: 0 },
    { label: t("links.user_withdrawals"), path: "/user-withdrawals", Icon: MoneySend, badge: 0 },
    { label: t("links.support"), path: "/support", Icon: Headphone, badge: liveThreadBadge },
    { label: t("links.contact"), path: "/contact", Icon: Message, badge: contactBadge },
  ];

  const morePathPrefixes = moreLinks.map((l) => l.path);

  function isActive(path: string) {
    return pathname.startsWith(path);
  }

  function isMoreActive() {
    return morePathPrefixes.some((p) => pathname.startsWith(p));
  }

  const totalMoreBadge = liveThreadBadge + contactBadge;

  return (
    <nav className={cn("lg:hidden rounded-t-3xl px-6", className)}>
      <ul className="flex gap-4 justify-between w-full">
        {primaryLinks.map(({ label, path, Icon }) => (
          <li key={path}>
            <Link
              href={path}
              className={`group flex flex-col items-center gap-1 text-[1.2rem] leading-6 ${
                isActive(path)
                  ? "font-semibold text-primary-500 is-active"
                  : "text-neutral-700 hover:text-primary-500"
              }`}
            >
              <Icon
                size="22"
                className={`transition-all duration-300 ${
                  isActive(path)
                    ? "stroke-primary-500 fill-primary-500"
                    : "stroke-neutral-900 fill-neutral-900 group-hover:stroke-primary-500 group-hover:fill-primary-500"
                }`}
                variant="Bulk"
              />
              <span>{label}</span>
            </Link>
          </li>
        ))}

        <li>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={`group relative flex flex-col items-center gap-1 text-[1.2rem] leading-6 cursor-pointer ${
                  isMoreActive()
                    ? "font-semibold text-primary-500"
                    : "text-neutral-700 hover:text-primary-500"
                }`}
              >
                {totalMoreBadge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[1.6rem] h-[1.6rem] rounded-full bg-failure text-white text-[1rem] font-bold flex items-center justify-center px-[3px] leading-none">
                    {totalMoreBadge > 9 ? "9+" : totalMoreBadge}
                  </span>
                )}
                <HamburgerMenu
                  size="22"
                  className={`transition-all duration-300 ${
                    isMoreActive()
                      ? "stroke-primary-500 fill-primary-500"
                      : "stroke-neutral-900 fill-neutral-900 group-hover:stroke-primary-500 group-hover:fill-primary-500"
                  }`}
                  variant="Bulk"
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
                          className={`transition-all duration-300 ${
                            isActive(path)
                              ? "stroke-primary-500 fill-primary-500"
                              : "stroke-neutral-900 fill-neutral-900"
                          }`}
                          variant="Bulk"
                        />
                        <span
                          className={`text-[1.4rem] leading-4 flex-1 ${
                            isActive(path) ? "text-primary-500" : "text-neutral-700"
                          }`}
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
                  <div className="bg-neutral-200 h-px w-full" />
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
                </ul>
              </div>
            </PopoverContent>
          </Popover>
        </li>
      </ul>
    </nav>
  );
}
