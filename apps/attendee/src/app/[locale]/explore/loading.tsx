import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import {
  ActivityCardSkeleton,
  Bone,
  IconButtonBone,
  PillBone,
  SkeletonPage,
  TitleBone,
} from "@/components/skeletons/Skeleton";

/** Mirrors ExplorePageContent: header, category tabs + filter chips, card grid. */
export default function Loading() {
  return (
    <AttendeeLayout title="Explore" className="overflow-x-hidden">
      <SkeletonPage>
        <header className="w-full flex items-center justify-between gap-4 lg:gap-6">
          <TitleBone className="w-[9rem] lg:w-[14rem]" />
          <div className="flex shrink-0 items-center gap-3 lg:gap-4">
            <Bone className="hidden lg:block w-[24.3rem] h-[3.7rem]" />
            <IconButtonBone className="lg:hidden" />
            <div className="w-[0.1rem] h-[1.8rem] bg-neutral-100 hidden lg:block" />
            <IconButtonBone />
            <IconButtonBone />
          </div>
        </header>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-4 pt-2 lg:pt-4">
          <Bone className="h-[4.5rem] w-[30rem] max-w-full" />
          <div className="flex items-center gap-[10px] overflow-hidden lg:ml-auto -mx-1 px-1 py-1">
            <PillBone className="w-[12rem]" />
            <PillBone className="w-[11rem]" />
            <PillBone className="w-[9rem]" />
            <PillBone className="w-[12rem]" />
          </div>
        </div>

        <div className="lg:pt-4 overflow-hidden flex flex-col gap-8 -mx-4">
          <ul className="list pt-2 lg:pt-4 px-4 pb-8 lg:pb-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="h-full flex">
                <ActivityCardSkeleton />
              </li>
            ))}
          </ul>
        </div>
      </SkeletonPage>
    </AttendeeLayout>
  );
}
