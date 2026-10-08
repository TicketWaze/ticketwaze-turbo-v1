"use client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { UpdateOrganisationCurrency } from "@/actions/organisationActions";
import PageLoader from "@/components/PageLoader";
import { Organisation } from "@ticketwaze/typescript-config";
import Separator from "@/components/shared/Separator";

export default function CurrencyPreference({
  organisation,
}: {
  organisation: Organisation;
}) {
  const t = useTranslations("Settings.profile.preferences");
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  // Controlled, so a failed save puts the radio back on the saved currency.
  const [currency, setCurrency] = useState(organisation.currency);
  const { data: session, update } = useSession();
  async function updateCurrency(next: string) {
    if (isLoading || next === currency) return;
    const previous = currency;
    setCurrency(next);
    setIsLoading(true);
    const response = await UpdateOrganisationCurrency(
      session?.activeOrganisation.organisationId ?? "",
      { currency: next },
      locale,
    );
    if (response.status !== "success") {
      setCurrency(previous);
      toast.error(response.error);
    } else {
      await update({
        ...session,
        activeOrganisation: {
          ...session?.activeOrganisation,
          currency: next,
        },
      });
    }
    setIsLoading(false);
  }
  return (
    <div className="flex flex-col gap-6">
      <PageLoader isLoading={isLoading} />
      <span className="font-medium text-[1.8rem] mb-4 leading-10 text-deep-100">
        {t("currency")}
      </span>
      <RadioGroup
        value={currency}
        disabled={isLoading}
        onValueChange={(e) => updateCurrency(e)}
        className="flex flex-col gap-6 w-full justify-between lg:justify-around"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-[1.6rem] text-deep-200">Gourdes</span>
          <RadioGroupItem value={"HTG"} />
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[1.6rem] text-deep-200">Dollard US</span>
          <RadioGroupItem value={"USD"} />
        </div>
      </RadioGroup>
    </div>
  );
}
