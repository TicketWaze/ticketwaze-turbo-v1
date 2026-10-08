import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { ReceiptSkeleton } from "@/components/skeletons/CheckoutSkeleton";

export default function Loading() {
  return (
    <AttendeeLayout title="">
      <ReceiptSkeleton rows={5} />
    </AttendeeLayout>
  );
}
