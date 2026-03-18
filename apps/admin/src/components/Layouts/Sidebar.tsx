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
  Ticket,
  UserSquare,
} from "iconsax-reactjs";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { signOut } from "next-auth/react";
import { useAuthInterceptor } from "@/hooks/useAuthInterceptor";
import { cn } from "@/lib/utils";

function Sidebar({ className }: { className: string }) {
  const t = useTranslations("Layout.sidebar");
  const pathname = usePathname();
  useAuthInterceptor();

  const userLinks = [
    {
      label: t("links.attendees"),
      path: `/attendees`,
      Icon: UserSquare,
    },
    {
      label: t("links.organisations"),
      path: `/organisations`,
      Icon: Building,
    },
  ];
  const operationsLinks = [
    {
      label: t("links.activities"),
      path: `/activities`,
      Icon: Calendar,
    },
    {
      label: t("links.tickets"),
      path: `/tickets`,
      Icon: Ticket,
    },
    {
      label: t("links.payments"),
      path: `/payments`,
      Icon: Money,
    },
    {
      label: t("links.payouts"),
      path: `/payouts`,
      Icon: MoneyRecive,
    },
  ];

  function isActive(path: string) {
    return pathname.startsWith(path);
  }

  function isUserGroupActive() {
    return (
      pathname.startsWith(`/attendees`) || pathname.startsWith(`/organisations`)
    );
  }

  function isOperationsGroupActive() {
    return (
      pathname.startsWith(`/profile`) ||
      pathname.startsWith(`/preferences`) ||
      pathname.startsWith(`/settings`)
    );
  }

  return (
    <aside
      className={cn(
        "flex-col hidden lg:flex overflow-y-auto min-h-0",
        className,
      )}
    >
      <div className={"flex-1 pt-12 flex flex-col gap-16 "}>
        <Image src={Logo} alt={"Ticket Waze Logo"} width={140} height={40} />
        <li>
          <Link
            href={"/analytics"}
            className={`group flex items-center gap-4 py-4 relative text-[1.5rem] leading-8 ${isActive("/analytics") ? "font-semibold text-primary-500 is-active" : "text-neutral-700 hover:text-primary-500"}`}
          >
            <Chart1
              size="20"
              className={`transition-all duration-500 ${isActive("/analytics") ? "stroke-primary-500 fill-primary-500" : "stroke-neutral-900 fill-neutral-900 group-hover:stroke-primary-500 group-hover:fill-primary-500"}  `}
              // className={`${isActive(path) ? "fill-icon-active" : "fill-icon"} group-hover:fill-icon-active`}
              variant="Bulk"
            />
            <span>{t("links.analytics")}</span>
            <div
              className={
                "absolute right-0  opacity-0 group-[.is-active]:translate-x-0 group-[.is-active]:opacity-100 transition-all duration-500 bg-primary-500 w-[.2rem] h-full"
              }
            ></div>
          </Link>
        </li>
        <nav>
          <div
            className={`mb-4 uppercase font-medium text-[1.4rem] leading-8 ${isUserGroupActive() ? "text-neutral-900" : "text-neutral-600"}`}
          >
            {t("links.title1")}
          </div>
          <ul className="flex flex-col gap-4">
            {userLinks.map(({ path, Icon, label }) => {
              return (
                <li key={label}>
                  <Link
                    href={path}
                    className={`group flex items-center gap-4 py-4 relative text-[1.5rem] leading-8 ${isActive(path) ? "font-semibold text-primary-500 is-active" : "text-neutral-700 hover:text-primary-500"}`}
                  >
                    <Icon
                      size="20"
                      className={`transition-all duration-500 ${isActive(path) ? "stroke-primary-500 fill-primary-500" : "stroke-neutral-900 fill-neutral-900 group-hover:stroke-primary-500 group-hover:fill-primary-500"}  `}
                      // className={`${isActive(path) ? "fill-icon-active" : "fill-icon"} group-hover:fill-icon-active`}
                      variant="Bulk"
                    />
                    <span>{label}</span>
                    <div
                      className={
                        "absolute right-0  opacity-0 group-[.is-active]:translate-x-0 group-[.is-active]:opacity-100 transition-all duration-500 bg-primary-500 w-[.2rem] h-full"
                      }
                    ></div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <nav>
          <div
            className={`mb-4 uppercase font-medium text-[1.4rem] leading-8 ${isOperationsGroupActive() ? "text-neutral-900" : "text-neutral-600"}`}
          >
            {t("links.title2")}
          </div>
          <ul className="flex flex-col gap-4">
            {operationsLinks.map(({ path, Icon, label }) => {
              return (
                <li key={label}>
                  <Link
                    href={path}
                    className={`group flex items-center gap-4 py-4 relative text-[1.5rem] leading-8 ${isActive(path) ? "font-semibold text-primary-500 is-active" : "text-neutral-700 hover:text-primary-500"}`}
                  >
                    <Icon
                      size="20"
                      className={`transition-all duration-500 ${isActive(path) ? "stroke-primary-500 fill-primary-500" : "stroke-neutral-900 fill-neutral-900 group-hover:stroke-primary-500 group-hover:fill-primary-500"}  `}
                      // className={`${isActive(path) ? "fill-icon-active" : "fill-icon"} group-hover:fill-icon-active`}
                      variant="Bulk"
                    />
                    <span>{label}</span>
                    <div
                      className={
                        "absolute right-0  opacity-0 group-[.is-active]:translate-x-0 group-[.is-active]:opacity-100 transition-all duration-500 bg-primary-500 w-[.2rem] h-full"
                      }
                    ></div>
                  </Link>
                </li>
              );
            })}
            <button
              onClick={() =>
                signOut({
                  redirect: true,
                  redirectTo: process.env.NEXT_PUBLIC_ATTENDEE_URL,
                })
              }
              className="flex items-center gap-4 py-2 mt-6"
            >
              <Logout size="20" color="#737c8a" variant="Bulk" />
              <span
                className={`text-[1.5rem] leading-4 text-neutral-700 cursor-pointer`}
              >
                {t("logout")}
              </span>
            </button>
          </ul>
        </nav>
      </div>
      {/* <div className="bg-neutral-300 rounded-[12.5px] p-[2.5px]">
        test
      </div> */}
    </aside>
  );
}

export default Sidebar;
