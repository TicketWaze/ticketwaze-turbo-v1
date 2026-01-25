"use client";
import ToggleIcon from "@/components/shared/ToggleIcon";
import { useTranslations } from "next-intl";

export default function Toggle2Factor() {
  const t = useTranslations("Settings.security");
  return (
    <div className="flex flex-col gap-8 w-full">
      <span className={"font-medium text-[1.8rem] leading-10 text-deep-100"}>
        {t("two_factor")}
      </span>
      <div className={"flex items-center justify-between"}>
        <p className={"text-[1.6rem] leading-[2.2rem] text-deep-100 max-w-152"}>
          {t("enable")}
        </p>
        <label className="relative inline-block h-12 w-20 cursor-pointer rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:transparent] has-checked:bg-primary-500">
          <input className="peer sr-only" id="2fa" type="checkbox" />
          <ToggleIcon />
        </label>
      </div>
    </div>
  );
}
