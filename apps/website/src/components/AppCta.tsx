"use client";
import { Link } from "@/i18n/navigation";
import { Ticket } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";

export default function AppCta() {
  const t = useTranslations("HomePage.hero");
  const locale = useLocale();
  return (
    <Link
      target="_blank"
      rel="noopener noreferrer"
      href={`${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/explore`}
      className="px-12 py-[7.5px] border border-[#E45B00] bg-[#fee7d5] rounded-[100px] flex items-center gap-4"
    >
      <Ticket size="20" color="#E45B00" variant="Bulk" />
      <span className="font-medium font-sans text-[1.5rem] text-primary-500">
        {t("cta.get")}
      </span>
    </Link>
  );
}
