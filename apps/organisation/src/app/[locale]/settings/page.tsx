import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale } from "next-intl/server";
import SettingsHome from "./SettingsHome";

export default async function Settings() {
  const locale = await getLocale();
  return (
    <OrganizerLayout title="">
      <SettingsHome
        helpUrl={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/${locale}/contact`}
      />
    </OrganizerLayout>
  );
}
