import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { TransactionsSkeleton } from "@/components/skeletons/WalletSkeleton";

export default function Loading() {
  return (
    <AttendeeLayout title="">
      <TransactionsSkeleton />
    </AttendeeLayout>
  );
}
