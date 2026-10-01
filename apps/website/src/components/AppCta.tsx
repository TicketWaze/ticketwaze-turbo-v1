"use client";
import { Link } from "@/i18n/navigation";
import { ArrowRight2, CalendarEdit, Star1, Ticket } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * The light orange pill used for the site's calls to action.
 *
 * - `get` (default): explore activities in the attendee app.
 * - `explore`: same as `get` with a star icon (the Personal page hero).
 * - `create`: create an activity in the organisation app.
 * - `started`: same destination as `get`, labelled "Get started" with a
 *   trailing arrow (the "From Discovery to Access" section).
 *
 * `href` and `label` override the variant's destination and wording; the
 * variant still picks the icon.
 */
export default function AppCta({
  variant = "get",
  href: hrefOverride,
  label: labelOverride,
  className,
}: {
  variant?: "get" | "explore" | "create" | "started";
  href?: string;
  label?: string;
  className?: string;
}) {
  const t = useTranslations("HomePage");
  const locale = useLocale();
  const href =
    hrefOverride ??
    (variant === "create"
      ? `${process.env.NEXT_PUBLIC_ORGANISATION_URL}/${locale}/auth/login`
      : `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/explore`);

  const label =
    labelOverride ??
    (variant === "create"
      ? t("hero.cta.create")
      : variant === "started"
        ? t("details3.cta.started")
        : t("hero.cta.get"));

  return (
    <Link
      target="_blank"
      rel="noopener noreferrer"
      href={href}
      className={cn(
        "h-[45px] min-w-[175px] border border-primary-400 rounded-[100px] flex items-center gap-[5px] transition-[filter] duration-300 hover:brightness-95",
        variant === "started"
          ? "justify-between px-[15px]"
          : "justify-center px-[30px]",
        className,
      )}
      style={{
        backgroundImage:
          "linear-gradient(162deg, rgba(255, 255, 255, 0.112) 2.35%, rgba(255, 175, 121, 0.2) 89.17%), linear-gradient(90deg, #ffefe2 0%, #ffefe2 100%)",
      }}
    >
      {variant === "get" && <Ticket size="20" color="#E45B00" variant="Bulk" />}
      {variant === "explore" && (
        <Star1 size="20" color="#E45B00" variant="Bulk" />
      )}
      {variant === "create" && (
        <CalendarEdit size="20" color="#E45B00" variant="Bulk" />
      )}
      <span className="font-medium font-sans text-[1.5rem] tracking-[-0.75px] text-primary-500 whitespace-nowrap">
        {label}
      </span>
      {variant === "started" && (
        <ArrowRight2 size="20" color="#E45B00" variant="Bulk" />
      )}
    </Link>
  );
}
