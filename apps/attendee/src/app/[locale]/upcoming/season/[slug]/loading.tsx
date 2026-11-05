import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import ActivityDetailSkeleton from "@/components/skeletons/ActivityDetailSkeleton";

export default function Loading() {
  return (
    <AttendeeLayout title="">
      <ActivityDetailSkeleton />
    </AttendeeLayout>
  );
}
