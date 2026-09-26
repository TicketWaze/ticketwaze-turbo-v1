"use client";
import Logo from "@ticketwaze/ui/assets/images/logo-horizontal-orange.svg";
import Image from "next/image";
import {
  Building,
  Clock,
  I24Support,
  LoginCurve,
  Logout,
  MoneyRecive,
  Setting5,
  Star,
  Ticket,
  User,
} from "iconsax-reactjs";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { signOut, useSession } from "next-auth/react";
import NoAuthDialog from "./NoAuthDialog";
import { useAuthInterceptor } from "@/hooks/useAuthInterceptor";
import { cn } from "@/lib/utils";
import { Dialog, DialogTrigger } from "../ui/dialog";

type NavLink = {
  label: string;
  path: string;
  Icon: typeof Ticket;
};

/**
 * One sidebar row. Signed out, a row that needs an account opens the sign-in
 * dialog instead of navigating to a page that would only bounce the visitor.
 */
function NavItem({
  link: { path, label, Icon },
  active,
  requiresAuth,
  isLoggedIn,
}: {
  link: NavLink;
  active: boolean;
  requiresAuth: boolean;
  isLoggedIn: boolean;
}) {
  const className = `group flex w-full items-center gap-4 py-4 relative text-[1.5rem] leading-8 ${active ? "font-semibold text-primary-500 is-active" : "text-neutral-700 hover:text-primary-500"}`;
  const content = (
    <>
      <Icon
        size="20"
        className={`transition-all duration-500 ${active ? "stroke-primary-500 fill-primary-500" : "stroke-neutral-900 fill-neutral-900 group-hover:stroke-primary-500 group-hover:fill-primary-500"}  `}
        variant="Bulk"
      />
      <span>{label}</span>
      <div
        className={
          "absolute right-0  opacity-0 group-[.is-active]:translate-x-0 group-[.is-active]:opacity-100 transition-all duration-500 bg-primary-500 w-[2px] h-full"
        }
      ></div>
    </>
  );

  if (requiresAuth && !isLoggedIn) {
    return (
      <Dialog>
        <DialogTrigger className={cn(className, "cursor-pointer")}>
          {content}
        </DialogTrigger>
        <NoAuthDialog callbackUrl={path} />
      </Dialog>
    );
  }

  return (
    <Link href={path} className={className}>
      {content}
    </Link>
  );
}

function Sidebar({ className }: { className: string }) {
  const t = useTranslations("Layout.sidebar");
  const pathname = usePathname();
  useAuthInterceptor();

  const eventsLinks: NavLink[] = [
    {
      label: t("links.upcoming"),
      path: `/upcoming`,
      Icon: Star,
    },
    {
      label: t("links.history"),
      path: `/history`,
      Icon: Clock,
    },
  ];
  const userLinks: NavLink[] = [
    {
      label: t("links.wallet"),
      path: `/wallet`,
      Icon: MoneyRecive,
    },
    {
      label: t("links.profile"),
      path: `/profile`,
      Icon: User,
    },
    {
      label: t("links.preferences"),
      path: `/preferences`,
      Icon: Setting5,
    },
  ];

  function isActive(path: string) {
    return pathname.startsWith(path);
  }

  function isEventGroupActive() {
    return (
      pathname.startsWith(`/explore`) ||
      pathname.startsWith(`/upcoming`) ||
      pathname.startsWith(`/history`) ||
      pathname.startsWith(`/organizers`)
    );
  }

  function isUserGroupActive() {
    return (
      pathname.startsWith(`/wallet`) ||
      pathname.startsWith(`/profile`) ||
      pathname.startsWith(`/preferences`) ||
      pathname.startsWith(`/settings`)
    );
  }
  const locale = useLocale();
  const { data: session, status } = useSession();
  const isLoggedIn = Boolean(session?.user);
  // Not while the session loads, or a signed-in user sees "Log in" flash.
  const isSignedOut = status === "unauthenticated";

  return (
    <aside
      className={cn(
        "flex-col hidden lg:flex overflow-y-auto min-h-0",
        className,
      )}
    >
      <div className={"flex-1 pt-12 flex flex-col gap-16 "}>
        <Link href={"/"}>
          <Image src={Logo} alt={"Ticket Waze Logo"} width={140} height={40} />
        </Link>
        <nav>
          <div
            className={`mb-4 uppercase font-medium text-[1.4rem] leading-8 ${isEventGroupActive() ? "text-neutral-900" : "text-neutral-600"}`}
          >
            {t("links.title1")}
          </div>
          <ul className="flex flex-col gap-4">
            <li>
              <NavItem
                link={{ label: t("links.explore"), path: "/explore", Icon: Ticket }}
                active={isActive("/explore")}
                requiresAuth={false}
                isLoggedIn={isLoggedIn}
              />
            </li>
            {eventsLinks.map((link) => (
              <li key={link.path}>
                <NavItem
                  link={link}
                  active={isActive(link.path)}
                  requiresAuth
                  isLoggedIn={isLoggedIn}
                />
              </li>
            ))}
            <li>
              <NavItem
                link={{
                  label: t("links.organizers"),
                  path: "/organisations",
                  Icon: Building,
                }}
                active={isActive("/organisations")}
                requiresAuth={false}
                isLoggedIn={isLoggedIn}
              />
            </li>
          </ul>
        </nav>
        {isLoggedIn && (
          <nav>
            <div
              className={`mb-4 uppercase font-medium text-[1.4rem] leading-8 ${isUserGroupActive() ? "text-neutral-900" : "text-neutral-600"}`}
            >
              {t("links.title2")}
            </div>
            <ul className="flex flex-col gap-4">
              {userLinks.map((link) => (
                <li key={link.path}>
                  <NavItem
                    link={link}
                    active={isActive(link.path)}
                    requiresAuth
                    isLoggedIn={isLoggedIn}
                  />
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
      {/* Pinned to the bottom: help, and the way in or out of an account. */}
      <ul className="flex flex-col gap-4 pt-8 pb-12">
        <li>
          <Link
            target="_blank"
            href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/${locale}/contact`}
            className="flex items-center gap-4 py-4"
          >
            <I24Support size="20" color="#737C8A" variant="Bulk" />
            <span className={`text-[1.5rem] leading-4 text-neutral-700`}>
              {t("help")}
            </span>
          </Link>
        </li>
        <li>
          {isLoggedIn && (
            <button
              onClick={() =>
                signOut({
                  redirect: true,
                  redirectTo: process.env.NEXT_PUBLIC_ATTENDEE_URL,
                })
              }
              className="flex items-center gap-4 py-4 cursor-pointer"
            >
              <Logout size="20" color="#737c8a" variant="Bulk" />
              <span className={`text-[1.5rem] leading-4 text-neutral-700`}>
                {t("logout")}
              </span>
            </button>
          )}
          {isSignedOut && (
            <Link href="/auth/login" className="flex items-center gap-4 py-4">
              <LoginCurve size="20" color="#E45B00" variant="Bulk" />
              <span
                className={`text-[1.5rem] leading-4 text-primary-500 font-medium`}
              >
                {t("login")}
              </span>
            </Link>
          )}
        </li>
      </ul>
    </aside>
  );
}

export default Sidebar;
