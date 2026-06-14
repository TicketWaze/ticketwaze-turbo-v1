"use client";
import { Link, usePathname } from "@/i18n/navigation";
import {
  Building,
  Calendar,
  Chart1,
  HamburgerMenu,
  Headphone,
  Logout,
  Money,
  MoneyRecive,
  Note,
  SecurityUser,
  Ticket,
  UserSquare,
} from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export default function MobileNavigation({
  className,
}: {
  className?: string;
}) {
  const t = useTranslations("Layout.sidebar");
  const pathname = usePathname();
  const locale = useLocale();

  const primaryLinks = [
    { label: t("links.analytics"), path: "/analytics", Icon: Chart1 },
    { label: t("links.activities"), path: "/activities", Icon: Calendar },
    { label: t("links.waitlist"), path: "/waitlist", Icon: Note },
  ];

  const moreLinks = [
    { label: t("links.attendees"), path: "/attendees", Icon: UserSquare },
    { label: t("links.organisations"), path: "/organisations", Icon: Building },
    { label: t("links.admins"), path: "/admins", Icon: SecurityUser },
    { label: t("links.tickets"), path: "/tickets", Icon: Ticket },
    { label: t("links.payments"), path: "/payments", Icon: Money },
    { label: t("links.payouts"), path: "/payouts", Icon: MoneyRecive },
    { label: t("links.support"), path: "/support", Icon: Headphone },
  ];

  const morePathPrefixes = moreLinks.map((l) => l.path);

  function isActive(path: string) {
    return pathname.startsWith(path);
  }

  function isMoreActive() {
    return morePathPrefixes.some((p) => pathname.startsWith(p));
  }

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
                className={`group flex flex-col items-center gap-1 text-[1.2rem] leading-6 cursor-pointer ${
                  isMoreActive()
                    ? "font-semibold text-primary-500"
                    : "text-neutral-700 hover:text-primary-500"
                }`}
              >
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
                  {moreLinks.map(({ label, path, Icon }) => (
                    <li key={path}>
                      <Link
                        href={path}
                        className="flex items-center gap-4 py-3"
                      >
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
                          className={`text-[1.4rem] leading-4 ${
                            isActive(path)
                              ? "text-primary-500"
                              : "text-neutral-700"
                          }`}
                        >
                          {label}
                        </span>
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
