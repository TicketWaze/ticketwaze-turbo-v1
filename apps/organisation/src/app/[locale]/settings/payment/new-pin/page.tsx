import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import ParameterMissingView from "@/components/Layouts/ParameterMissingView";
import NewPinForm from "./NewPinForm";
import BackButton from "@/components/shared/BackButton";
import TopBar from "@/components/shared/TopBar";
import { getTranslations } from "next-intl/server";

export default async function NewPin({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const changePinToken = (await searchParams).changePinToken;
  if (!changePinToken || changePinToken.length === 0) {
    return (
      <OrganizerLayout title="">
        <ParameterMissingView redirectTo="/settings/payment" />
      </OrganizerLayout>
    );
  }
  const t = await getTranslations("Settings.payment");
  return (
    <OrganizerLayout title="">
      <div className="flex flex-col gap-8">
        <BackButton text={t("back")} />
        <TopBar title={t("new_pin")} />
      </div>
      <NewPinForm changePinToken={changePinToken} />
    </OrganizerLayout>
  );
}
