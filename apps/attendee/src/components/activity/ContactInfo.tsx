"use client";
import { useTranslations } from "next-intl";
import { Call, Global, Sms } from "iconsax-reactjs";

/**
 * The organiser's contact block (Figma "Contact Information"): email, phone
 * and website, each a working link. Renders nothing when there is nothing.
 */
export default function ContactInfo({
  email,
  phone,
  website,
}: {
  email?: string | null;
  phone?: string | null;
  website?: string | null;
}) {
  const t = useTranslations("Event");
  if (!email && !phone && !website) return null;
  const row =
    "flex items-center gap-4 text-[1.5rem] leading-8 text-neutral-700 hover:text-primary-500 transition-colors w-fit";
  return (
    <div className="flex flex-col gap-6">
      <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
        {t("contact")}
      </span>
      <div className="flex flex-col gap-4">
        {email && (
          <a href={`mailto:${email}`} className={row}>
            <Sms size="20" color="#737c8a" variant="Bulk" />
            {email}
          </a>
        )}
        {phone && (
          <a href={`tel:${String(phone).replace(/\s+/g, "")}`} className={row}>
            <Call size="20" color="#737c8a" variant="Bulk" />
            {phone}
          </a>
        )}
        {website && (
          <a
            href={/^https?:\/\//.test(website) ? website : `https://${website}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${row} underline underline-offset-4`}
          >
            <Global size="20" color="#737c8a" variant="Bulk" />
            {website.replace(/^https?:\/\//, "")}
          </a>
        )}
      </div>
    </div>
  );
}
