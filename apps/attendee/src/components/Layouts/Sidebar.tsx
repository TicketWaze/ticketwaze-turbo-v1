"use client";
import Logo from "@ticketwaze/ui/assets/images/logo-horizontal-orange.svg";
import Image from "next/image";
import {
  Clock,
  I24Support,
  Logout,
  MoneyRecive,
  Setting5,
  Star,
  Ticket,
  User,
  UserSquare,
} from "iconsax-reactjs";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { signOut, useSession } from "next-auth/react";
import NoAuthDialog from "./NoAuthDialog";
import { useAuthInterceptor } from "@/hooks/useAuthInterceptor";
import { cn } from "@/lib/utils";
import { Dialog, DialogTrigger } from "../ui/dialog";

function Sidebar({ className }: { className: string }) {
  const t = useTranslations("Layout.sidebar");
  const pathname = usePathname();
  useAuthInterceptor();

  const eventsLinks = [
    // {
    //   label: t("links.explore"),
    //   path: `/explore`,
    //   Icon: Ticket,
    // },
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
    {
      label: t("links.organizers"),
      path: `/organizers`,
      Icon: UserSquare,
    },
  ];
  const userLinks = [
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
    // {
    //   label: t("links.settings"),
    //   path: `/settings`,
    //   Icon: Setting,
    // },
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
      pathname.startsWith(`/profile`) ||
      pathname.startsWith(`/preferences`) ||
      pathname.startsWith(`/settings`)
    );
  }
  const locale = useLocale();
  const { data: session } = useSession();

  return (
    <aside
      className={cn(
        "flex-col hidden lg:flex overflow-y-auto min-h-0",
        className,
      )}
    >
      <div className={"flex-1 pt-12 flex flex-col gap-16 "}>
        <Image src={Logo} alt={"Ticket Waze Logo"} width={140} height={40} />
        <nav>
          <div
            className={`mb-4 uppercase font-medium text-[1.4rem] leading-8 ${isEventGroupActive() ? "text-neutral-900" : "text-neutral-600"}`}
          >
            {t("links.title1")}
          </div>
          <ul className="flex flex-col gap-4">
            <li>
              <Link
                href={"/explore"}
                className={`group flex items-center gap-4 py-4 relative text-[1.5rem] leading-[20px] ${isActive("/explore") ? "font-semibold text-primary-500 is-active" : "text-neutral-700 hover:text-primary-500"}`}
              >
                <Ticket
                  size="20"
                  className={`transition-all duration-500 ${isActive("/explore") ? "stroke-primary-500 fill-primary-500" : "stroke-neutral-900 fill-neutral-900 group-hover:stroke-primary-500 group-hover:fill-primary-500"}  `}
                  // className={`${isActive(path) ? "fill-icon-active" : "fill-icon"} group-hover:fill-icon-active`}
                  variant="Bulk"
                />
                <span>{t("links.explore")}</span>
                <div
                  className={
                    "absolute right-0  opacity-0 group-[.is-active]:translate-x-0 group-[.is-active]:opacity-100 transition-all duration-500 bg-primary-500 w-[2px] h-full"
                  }
                ></div>
              </Link>
            </li>
            {eventsLinks.map(({ path, Icon, label }) => {
              return (
                <li key={label}>
                  {session?.user ? (
                    <Link
                      href={path}
                      className={`group flex items-center gap-4 py-4 relative text-[1.5rem] leading-[20px] ${isActive(path) ? "font-semibold text-primary-500 is-active" : "text-neutral-700 hover:text-primary-500"}`}
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
                          "absolute right-0  opacity-0 group-[.is-active]:translate-x-0 group-[.is-active]:opacity-100 transition-all duration-500 bg-primary-500 w-[2px] h-full"
                        }
                      ></div>
                    </Link>
                  ) : (
                    <Dialog>
                      <DialogTrigger>
                        <div
                          className={`group flex cursor-pointer items-center gap-4 py-4 relative text-[1.5rem] leading-[20px] ${isActive(path) ? "font-semibold text-primary-500 is-active" : "text-neutral-700 hover:text-primary-500"}`}
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
                              "absolute right-0  opacity-0 group-[.is-active]:translate-x-0 group-[.is-active]:opacity-100 transition-all duration-500 bg-primary-500 w-[2px] h-full"
                            }
                          ></div>
                        </div>
                      </DialogTrigger>
                      <NoAuthDialog />
                    </Dialog>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        {session?.user && (
          <nav>
            <div
              className={`mb-4 uppercase font-medium text-[1.4rem] leading-8 ${isUserGroupActive() ? "text-neutral-900" : "text-neutral-600"}`}
            >
              {t("links.title2")}
            </div>
            <ul className="flex flex-col gap-4">
              {userLinks.map(({ path, Icon, label }) => {
                return (
                  <li key={label}>
                    <Link
                      href={path}
                      className={`group flex items-center gap-4 py-4 relative text-[1.5rem] leading-[20px] ${isActive(path) ? "font-semibold text-primary-500 is-active" : "text-neutral-700 hover:text-primary-500"}`}
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
                          "absolute right-0  opacity-0 group-[.is-active]:translate-x-0 group-[.is-active]:opacity-100 transition-all duration-500 bg-primary-500 w-[2px] h-full"
                        }
                      ></div>
                    </Link>
                  </li>
                );
              })}
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
              <button
                onClick={() =>
                  signOut({
                    redirect: true,
                    redirectTo: process.env.NEXT_PUBLIC_ATTENDEE_URL,
                  })
                }
                className="flex items-center gap-4 py-2"
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
        )}
      </div>
      {/* <div className="bg-neutral-300 rounded-[12.5px] p-[2.5px]">
        test
      </div> */}
    </aside>
  );
}

export default Sidebar;
