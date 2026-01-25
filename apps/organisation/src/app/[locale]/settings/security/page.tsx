import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getTranslations } from "next-intl/server";
import ChangePasswordForm from "./ChangePasswordForm";
import BackButton from "@/components/shared/BackButton";
import TopBar from "@/components/shared/TopBar";

export default async function Page() {
  const t = await getTranslations("Settings.security");
  return (
    <OrganizerLayout title={t("title")}>
      <div className="flex flex-col gap-8">
        <BackButton text={t("back")} />
        <TopBar title={t("title")} />
      </div>
      <div
        className={
          "flex flex-col overflow-y-scroll overflow-x-hidden gap-16 w-full lg:w-212 mx-auto"
        }
      >
        <ChangePasswordForm />
        <div></div>
        {/* <Toggle2Factor /> */}
      </div>
    </OrganizerLayout>
  );
}
