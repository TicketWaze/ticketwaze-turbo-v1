import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getTranslations, getLocale } from "next-intl/server";
import PaymentInformationsForm from "./PaymentInformationsForm";
import BackButton from "@/components/shared/BackButton";
import TopBar from "@/components/shared/TopBar";
import { ButtonPrimary } from "@/components/shared/buttons";
import { auth } from "@/lib/auth";
import { Organisation } from "@ticketwaze/typescript-config";
import PinHandler from "./PinHandler";

export default async function Page() {
  const t = await getTranslations("Settings.payment");
  const locale = await getLocale();
  const session = await auth();
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations/me/${session?.activeOrganisation.organisationId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": locale,
        origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    },
  );
  const response = await request.json();
  const organisation: Organisation = response.organisation;
  return (
    <OrganizerLayout title={t("title")}>
      <div className="flex flex-col gap-8">
        <BackButton text={t("back")} />
        <TopBar title={t("title")}>
          <div className="hidden lg:block">
            <PinHandler organisation={organisation} />
          </div>
          <ButtonPrimary form="payment-form">{t("save")}</ButtonPrimary>
        </TopBar>
      </div>
      <PaymentInformationsForm organisation={organisation} />
    </OrganizerLayout>
  );
}
