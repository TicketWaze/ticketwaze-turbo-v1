import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";

export default function Loading() {
  return (
    <AttendeeLayout
      title=""
      className="h-full flex items-center justify-center"
    >
      <LoadingCircleSmall />
    </AttendeeLayout>
  );
}
