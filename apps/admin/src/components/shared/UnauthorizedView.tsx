import { ShieldSlash, type Icon } from "iconsax-reactjs";
import { useTranslations } from "next-intl";

/**
 * Figma "Admin" → No access (4300:82406): the section's icon in two grey
 * circles and a short note, centred where the content would be. Pass the
 * section's own icon (the chart for Analytics); a shield otherwise.
 */
export default function UnauthorizedView({
  icon: IconComponent = ShieldSlash,
}: {
  icon?: Icon;
}) {
  const t = useTranslations("Layout");
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-10 py-24 text-center">
      <div className="w-[12rem] h-[12rem] rounded-full bg-neutral-100 flex items-center justify-center">
        <div className="w-[9rem] h-[9rem] rounded-full bg-neutral-200/70 flex items-center justify-center">
          <IconComponent size="40" color="#232529" variant="Bulk" />
        </div>
      </div>
      <p className="max-w-[40rem] text-[1.5rem] leading-9 text-neutral-500">
        {t("no_access")}
      </p>
    </div>
  );
}
