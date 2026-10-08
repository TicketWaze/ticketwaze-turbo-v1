"use client";
import Logo from "@ticketwaze/ui/assets/images/logo-horizontal-orange.svg";
import Image from "next/image";
import {
  Building,
  Calendar,
  Chart1,
  Logout,
  Money,
  MoneyRecive,
  Setting2,
  Ticket,
  UserSquare,
  type Icon,
} from "iconsax-reactjs";
import { Link, usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { signOut, useSession } from "next-auth/react";
import { useAuthInterceptor } from "@/hooks/useAuthInterceptor";
import { cn } from "@/lib/utils";
import { useAdminSocket } from "@/lib/AdminSocketContext";
import { useEffect } from "react";
import { SETTINGS_PATHS } from "./settingsLinks";

/**
 * Figma "Admin" sidebar: logo + ADMIN badge, Analytics, then USERS
 * (Attendees, Organizers) and OPERATIONS (Events, Tickets, Payments,
 * Payouts), with a grey card at the bottom: Settings, Log out and the signed-in
 * admin. Everything else (live chat, contact messages, waitlist, KYC,
 * administrators, pending edits, finance, emails) lives in the Settings hub;
 * unread live-chat and contact counts surface on the Settings row.
 */
function Sidebar({ className }: { className: string }) {
  const t = useTranslations("Layout.sidebar");
  const pathname = usePathname();
  const locale = useLocale();
  const { data: session } = useSession();
  useAuthInterceptor();

  const { liveThreadBadge, contactBadge, clearLiveThreadBadge, clearContactBadge } =
    useAdminSocket();

  useEffect(() => {
    if (pathname.startsWith("/support")) clearLiveThreadBadge();
  }, [pathname, clearLiveThreadBadge]);

  useEffect(() => {
    if (pathname.startsWith("/contact")) clearContactBadge();
  }, [pathname, clearContactBadge]);

  const groups: { title?: string; links: { label: string; path: string; Icon: Icon }[] }[] = [
    { links: [{ label: t("links.analytics"), path: "/analytics", Icon: Chart1 }] },
    {
      title: t("links.title1"),
      links: [
        { label: t("links.attendees"), path: "/attendees", Icon: UserSquare },
        { label: t("links.organisations"), path: "/organisations", Icon: Building },
      ],
    },
    {
      title: t("links.title2"),
      links: [
        { label: t("links.activities"), path: "/activities", Icon: Calendar },
        { label: t("links.tickets"), path: "/tickets", Icon: Ticket },
        { label: t("links.payments"), path: "/payments", Icon: Money },
        { label: t("links.payouts"), path: "/payouts", Icon: MoneyRecive },
      ],
    },
  ];

  function isActive(path: string) {
    // Pending edits sit under /activities but belong to the Settings hub.
    if (path === "/activities") {
      return pathname.startsWith(path) && !pathname.startsWith("/activities/revisions");
    }
    return pathname.startsWith(path);
  }

  const settingsActive = SETTINGS_PATHS.some((p) => pathname.startsWith(p));
  const settingsBadge = liveThreadBadge + contactBadge;
  const email = (session?.user?.email as string | undefined) ?? "";

  return (
    <aside className={cn("flex-col hidden lg:flex overflow-y-auto min-h-0 pb-2", className)}>
      <div className="flex-1 pt-12 flex flex-col gap-14">
        <div className="flex items-center gap-3">
          <Image src={Logo} alt="Ticketwaze" width={130} height={37} />
          <span className="rounded-[3rem] bg-primary-50 px-3 py-[.2rem] text-[1.1rem] font-bold uppercase leading-6 text-primary-500">
            {t("badge")}
          </span>
        </div>
        {groups.map((group, i) => (
          <nav key={i} className="flex flex-col">
            {group.title && (
              <div className="mb-4 uppercase font-medium text-[1.4rem] leading-8 text-neutral-600">
                {group.title}
              </div>
            )}
            <ul className="flex flex-col gap-2">
              {group.links.map(({ path, Icon, label }) => (
                <li key={path}>
                  <NavLink href={path} active={isActive(path)} Icon={Icon} label={label} />
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Figma's bottom card: Settings, Log out, then who is signed in. */}
      <div className="mt-10 rounded-[2rem] bg-neutral-100 p-2 flex flex-col">
        <div className="px-6 py-2 flex flex-col">
          <Link
            href="/settings"
            className={cn(
              "group flex items-center gap-4 py-4 text-[1.5rem] leading-8 transition-colors",
              settingsActive ? "font-semibold text-primary-500" : "text-neutral-700 hover:text-primary-500",
            )}
          >
            <Setting2
              size="20"
              variant="Bulk"
              className={cn(
                "transition-all duration-500",
                settingsActive
                  ? "stroke-primary-500 fill-primary-500"
                  : "stroke-neutral-600 fill-neutral-600 group-hover:stroke-primary-500 group-hover:fill-primary-500",
              )}
            />
            <span>{t("settings")}</span>
            {settingsBadge > 0 && (
              <span className="ml-auto min-w-[2rem] h-[2rem] rounded-full bg-failure text-white text-[1.1rem] font-bold flex items-center justify-center px-1 leading-none">
                {settingsBadge > 9 ? "9+" : settingsBadge}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() =>
              signOut({
                redirect: true,
                redirectTo: `${process.env.NEXT_PUBLIC_ADMIN_URL}/${locale}/auth/login`,
              })
            }
            className="group flex items-center gap-4 py-4 text-[1.5rem] leading-8 text-neutral-700 hover:text-primary-500 cursor-pointer transition-colors"
          >
            <Logout
              size="20"
              variant="Bulk"
              className="stroke-neutral-600 fill-neutral-600 group-hover:stroke-primary-500 group-hover:fill-primary-500 transition-all duration-500"
            />
            <span>{t("logout")}</span>
          </button>
        </div>
        {email && (
          <div className="flex items-center gap-4 rounded-[1.5rem] bg-white border border-neutral-100 p-3">
            <span className="w-[3.2rem] h-[3.2rem] rounded-full bg-black text-white flex items-center justify-center font-primary font-medium text-[1.5rem] shrink-0">
              {email[0]?.toUpperCase()}
            </span>
            <span className="text-[1.4rem] leading-8 text-neutral-700 truncate" title={email}>
              {email}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}

function NavLink({
  href,
  active,
  Icon,
  label,
}: {
  href: string;
  active: boolean;
  Icon: Icon;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-4 py-4 relative text-[1.5rem] leading-8",
        active ? "font-semibold text-primary-500 is-active" : "text-neutral-700 hover:text-primary-500",
      )}
    >
      <Icon
        size="20"
        variant="Bulk"
        className={cn(
          "transition-all duration-500",
          active
            ? "stroke-primary-500 fill-primary-500"
            : "stroke-neutral-900 fill-neutral-900 group-hover:stroke-primary-500 group-hover:fill-primary-500",
        )}
      />
      <span>{label}</span>
      <div className="absolute right-0 opacity-0 group-[.is-active]:opacity-100 transition-all duration-500 bg-primary-500 w-[.2rem] h-full" />
    </Link>
  );
}

export default Sidebar;
