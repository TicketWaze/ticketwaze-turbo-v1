import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { ResultSkeleton } from "@/components/skeletons/CheckoutSkeleton";

/** Every payment return page under /explore/checkout/success. */
export default function Loading() {
  return (
    <AttendeeLayout title="" className="items-center justify-center">
      <ResultSkeleton />
    </AttendeeLayout>
  );
}
