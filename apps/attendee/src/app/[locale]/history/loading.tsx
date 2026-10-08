import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { ListPageSkeleton } from "@/components/skeletons/ListSkeletons";

export default function Loading() {
  return (
    <AttendeeLayout title="" className="overflow-x-hidden">
      <ListPageSkeleton card="history" />
    </AttendeeLayout>
  );
}
