import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import BrandedLoader from "@/components/shared/BrandedLoader";

export default function Loading() {
  return (
    <AttendeeLayout
      title=""
      className="h-full flex items-center justify-center"
    >
      <BrandedLoader />
    </AttendeeLayout>
  );
}
