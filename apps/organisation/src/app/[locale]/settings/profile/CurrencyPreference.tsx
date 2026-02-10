"use client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { UpdateOrganisationCurrency } from "@/actions/organisationActions";
import PageLoader from "@/components/PageLoader";
import { Organisation } from "@ticketwaze/typescript-config";

export default function CurrencyPreference({
  organisation,
  authorized,
}: {
  organisation: Organisation;
  authorized: boolean;
}) {
  const t = useTranslations("Settings.profile.preferences");
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, update } = useSession();
  async function updateCurrency(currency: string) {
    setIsLoading(true);
    const response = await UpdateOrganisationCurrency(
      session?.activeOrganisation.organisationId ?? "",
      session?.user.accessToken ?? "",
      {
        currency,
      },
      locale,
    );
    if (response.status !== "success") {
      toast.error(response.error);
    } else {
      await update({
        ...session,
        activeOrganisation: {
          ...session?.activeOrganisation,
          currency,
        },
      });
    }
    setIsLoading(false);
  }
  return (
    <div className="flex flex-col gap-6">
      <PageLoader isLoading={isLoading} />
      <span className="font-medium text-[1.8rem] mb-4 leading-[25px] text-deep-100">
        {t("currency")}
      </span>
      <RadioGroup
        disabled={!authorized}
        defaultValue={organisation.currency}
        onValueChange={(e) => updateCurrency(e)}
        className="flex gap-6 w-full justify-between lg:justify-around"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-[1.4rem] text-deep-100">Gourdes</span>
          <RadioGroupItem value={"HTG"} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[1.4rem] text-deep-100">Dollard US</span>
          <RadioGroupItem value={"USD"} />
        </div>
      </RadioGroup>
    </div>
  );
}
