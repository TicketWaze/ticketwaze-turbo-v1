"use client";
import { InfoCircle } from "iconsax-reactjs";
import { useTranslations } from "next-intl";

export default function ProFeatureAlert() {
  const t = useTranslations("Layout");
  return (
    <div className="flex flex-col justify-center items-center gap-4">
      <InfoCircle size="32" color="#D5D8DC" />
      <span className="font-primary text-[1.2rem] text-neutral-500">
        {t("proFeature")}
      </span>
    </div>
  );
}
