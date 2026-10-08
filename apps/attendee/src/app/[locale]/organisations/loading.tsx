import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { OrganisationsSkeleton } from "@/components/skeletons/ListSkeletons";

export default function Loading() {
  return (
    <AttendeeLayout title="">
      <OrganisationsSkeleton />
    </AttendeeLayout>
  );
}
