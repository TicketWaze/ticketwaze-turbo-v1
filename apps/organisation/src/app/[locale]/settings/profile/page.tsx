import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getTranslations } from "next-intl/server";
import ProfileImage from "./ProfileImage";
import ProfileForm from "./ProfileForm";
import BackButton from "@/components/shared/BackButton";
import TopBar from "@/components/shared/TopBar";
import { ButtonPrimary } from "@/components/shared/buttons";

export default async function ProfilePage() {
  const t = await getTranslations("Settings.profile");
  return (
    <OrganizerLayout title={t("title")}>
      <div className="flex flex-col gap-8">
        <BackButton text={t("back")} />
        <TopBar title={t("title")}>
          <ButtonPrimary form="profile-form">{t("save")}</ButtonPrimary>
        </TopBar>
      </div>
      <div
        className={
          "flex flex-col gap-16 w-full lg:w-212 mx-auto overflow-y-scroll overflow-x-hidden h-full"
        }
      >
        <ProfileImage />
        <ProfileForm />
      </div>
    </OrganizerLayout>
  );
}
