import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import TicketPageSkeleton from "@/components/skeletons/TicketPageSkeleton";

export default function Loading() {
  return (
    <AttendeeLayout title="">
      <TicketPageSkeleton />
    </AttendeeLayout>
  );
}
