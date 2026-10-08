import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { TableSkeleton } from "../loading";

/** Back, then the full table. */
export default function Loading() {
  return (
    <OrganizerLayout title="">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <div className="bg-neutral-200 animate-pulse size-[3.5rem] rounded-full" />
          <div className="bg-neutral-200 animate-pulse w-20 h-6 rounded-lg" />
        </div>
        <TableSkeleton />
        <TableSkeleton />
      </div>
    </OrganizerLayout>
  );
}
