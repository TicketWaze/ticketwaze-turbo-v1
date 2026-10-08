import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { PurchasesSkeleton } from "@/components/skeletons/WalletSkeleton";

export default function Loading() {
  return (
    <AttendeeLayout title="">
      <PurchasesSkeleton />
    </AttendeeLayout>
  );
}
