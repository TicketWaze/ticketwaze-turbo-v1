import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import WalletSkeleton from "@/components/skeletons/WalletSkeleton";

export default function Loading() {
  return (
    <AttendeeLayout title="">
      <WalletSkeleton />
    </AttendeeLayout>
  );
}
