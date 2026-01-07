"use client";

import { Verify } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

function VerifiedOrganisationCheckMark() {
  const t = useTranslations("BusinessPage.pricing.entreprise");
  return (
    <Tooltip>
      <TooltipTrigger asChild className="inline-block">
        <Verify size="24" variant={"Bulk"} color="#E45B00" />
      </TooltipTrigger>
      <TooltipContent>
        <p className={"font-primary text-[1.4rem]"}>{t("verified")}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default VerifiedOrganisationCheckMark;
