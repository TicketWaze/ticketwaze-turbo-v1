import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import SettingsSkeleton, {
  PasswordFormBone,
  SettingsSectionBone,
} from "@/components/skeletons/SettingsSkeleton";

/** Mirrors SettingsContent: password form, 2FA switch, language, others. */
export default function Loading() {
  return (
    <AttendeeLayout title="">
      <SettingsSkeleton>
        <PasswordFormBone />
        <SettingsSectionBone rows={1} control="toggle" titleWidth="w-56" />
        <SettingsSectionBone rows={2} control="radio" titleWidth="w-36" />
        <SettingsSectionBone rows={3} control="arrow" titleWidth="w-28" />
      </SettingsSkeleton>
    </AttendeeLayout>
  );
}
