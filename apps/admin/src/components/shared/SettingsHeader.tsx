import React from "react";
import { ArrowLeft2 } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * The sticky heading of a page behind Settings: a "‹ Settings" link back to
 * the hub (the sidebar has no row for these pages), the title, an optional
 * one-line description and page actions on the right. Must stay a direct child
 * of PAGE_SCROLLER to stick — see PageTitle.
 *
 * No hooks but useTranslations, so it renders in server and client pages
 * alike. Pass `back` to point a sub-page at its own list instead.
 */
export default function SettingsHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  const t = useTranslations("Settings");
  const link = back ?? { href: "/settings", label: t("title") };
  return (
    <div className="sticky top-0 z-20 bg-white pb-8 flex flex-col gap-4">
      <Link
        href={link.href}
        className="group w-fit flex items-center gap-3 text-[1.4rem] leading-8 text-neutral-700 hover:text-deep-100 transition-colors"
      >
        <span className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center transition-transform duration-200 group-hover:-translate-x-0.5">
          <ArrowLeft2 size="14" color="#0d0d0d" variant="Bulk" />
        </span>
        {link.label}
      </Link>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2 min-w-0">
          <h3 className="font-primary font-medium text-[2.6rem] leading-12 text-black">{title}</h3>
          {description && (
            <p className="text-[1.5rem] leading-8 text-neutral-600">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-4">{actions}</div>}
      </div>
    </div>
  );
}
