import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import SettingsSkeleton, { SettingsSectionBone } from "@/components/skeletons/SettingsSkeleton";

/** Mirrors PreferencesForm: 10 interests, 3 email switches, 2 currencies. */
export default function Loading() {
  return (
    <AttendeeLayout title="">
      <SettingsSkeleton>
        <SettingsSectionBone rows={10} control="checkbox" />
        <SettingsSectionBone rows={3} control="toggle" titleWidth="w-56" />
        <SettingsSectionBone rows={2} control="radio" titleWidth="w-32" />
      </SettingsSkeleton>
    </AttendeeLayout>
  );
}
