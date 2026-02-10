"use client";
import { ShieldSecurity } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import OrganizerLayout from "./OrganizerLayout";

export default function UnauthorizedView() {
  const t = useTranslations("Layout");
  return (
    <OrganizerLayout title="">
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-20">
          <div className="w-48 h-48 bg-neutral-100 rounded-full flex items-center justify-center">
            <div className="w-36 h-36 bg-neutral-200 rounded-full flex items-center justify-center">
              <ShieldSecurity size="50" color="#0D0D0D" variant="Bulk" />
            </div>
          </div>
          <p className="text-[1.8rem] leading-8 text-neutral-600 text-center max-w-200">
            {t("noAccess")}
          </p>
        </div>
      </div>
    </OrganizerLayout>
  );
}
