"use client";
import ToggleIcon from "@/components/shared/ToggleIcon";
import { Warning2 } from "iconsax-reactjs";
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
        <label className="relative cursor-not-allowed inline-block h-12 w-20 rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:transparent] has-checked:bg-primary-500">
          <input
            className="peer sr-only cursor-not-allowed"
            id="2fa"
            type="checkbox"
            checked
            readOnly
            disabled
          />
          <ToggleIcon />
        </label>
      </div>
      <div className="flex flex-col items-start gap-4 border p-4 rounded-2xl border-neutral-300">
        <Warning2 size="24" color="#737C8A" variant="Bulk" />
        <div>
          <span className="text-[1.2rem] leading-8 text-neutral-900">
            {t("securityTip")}
          </span>
          <p className="text-[1.2rem] leading-8 text-neutral-800">
            {t("2faTip")}
          </p>
        </div>
      </div>
    </div>
  );
}
