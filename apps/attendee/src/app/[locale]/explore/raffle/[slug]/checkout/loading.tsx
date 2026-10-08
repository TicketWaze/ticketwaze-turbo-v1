import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import CheckoutSkeleton from "@/components/skeletons/CheckoutSkeleton";

export default function Loading() {
  return (
    <AttendeeLayout title="">
      <CheckoutSkeleton footer={false} />
    </AttendeeLayout>
  );
}
