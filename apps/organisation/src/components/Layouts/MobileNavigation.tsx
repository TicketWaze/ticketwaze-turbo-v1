"use client";
import { useAuthInterceptor } from "@/hooks/useAuthInterceptor";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Chart1, Moneys, Setting2, Ticket } from "iconsax-reactjs";
import { useTranslations } from "next-intl";

export default function MobileNavigation({
  className,
}: {
  className?: string;
}) {
  const t = useTranslations("Layout.sidebar");
  useAuthInterceptor();
  const pathname = usePathname();
  const links = [
    {
      label: t("analytics"),
      path: "/analytics",
      Icon: Chart1,
    },
    {
      label: t("events"),
      path: "/events",
      Icon: Ticket,
    },
    {
      label: t("finance"),
      path: "/finance",
      Icon: Moneys,
    },
    {
      label: t("settings"),
      path: "/settings",
      Icon: Setting2,
    },
  ];
  function isActive(path: string) {
    return pathname.startsWith(path);
  }
  return (
    <nav className={cn(`lg:hidden rounded-t-3xl px-6`, className)}>
      <ul className={" flex gap-4 justify-between w-full"}>
        {links.map(({ label, Icon, path }) => {
          return (
            <li key={path}>
              <Link
                href={path}
                className={` group font-normal group text-[1.5rem] leading-8 text-neutral-700 hover:text-primary-500 flex flex-col items-center  gap-4 ${isActive(path) && "font-semibold text-primary-500 is-active"}`}
              >
                <Icon
                  size="20"
                  className={`transition-all duration-500 ${isActive(path) ? "stroke-primary-500 fill-primary-500" : "stroke-neutral-900 fill-neutral-900 group-hover:stroke-primary-500 group-hover:fill-primary-500"}  `}
                  variant="Bulk"
                />
                <span className={""}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
