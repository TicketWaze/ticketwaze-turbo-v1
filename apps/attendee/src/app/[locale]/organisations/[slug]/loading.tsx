import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import OrganisationProfileSkeleton from "@/components/skeletons/OrganisationProfileSkeleton";

export default function Loading() {
  return (
    <AttendeeLayout title="">
      <OrganisationProfileSkeleton />
    </AttendeeLayout>
  );
}
