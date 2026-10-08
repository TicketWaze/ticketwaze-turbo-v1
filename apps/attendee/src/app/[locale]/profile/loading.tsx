import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import ProfileSkeleton from "@/components/skeletons/ProfileSkeleton";

export default function Loading() {
  return (
    <AttendeeLayout title="">
      <ProfileSkeleton />
    </AttendeeLayout>
  );
}
