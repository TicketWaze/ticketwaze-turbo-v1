import { getTranslations } from "next-intl/server";
import AdminLayout from "@/components/Layouts/AdminLayout";
import { PAGE_SCROLLER } from "@/components/shared/PageTitle";
import SettingsHub from "./SettingsHub";

/** Settings: the tools that are not in Figma's sidebar, as a grid of cards. */
export default async function SettingsPage() {
  const t = await getTranslations("Settings");
  return (
    <AdminLayout>
      <div className={PAGE_SCROLLER}>
        {/* Title and description stick together, as on Analytics. */}
        <div className="sticky top-0 z-20 bg-white pb-6 flex flex-col gap-2">
          <h3 className="font-primary font-medium text-[2.6rem] leading-12 text-black">
            {t("title")}
          </h3>
          <p className="text-[1.5rem] leading-8 text-neutral-600">{t("description")}</p>
        </div>
        <SettingsHub />
      </div>
    </AdminLayout>
  );
}
