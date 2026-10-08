import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { BackBone } from "@/components/skeletons/ActivityDetailSkeleton";
import { Bone, SkeletonPage, TextBone } from "@/components/skeletons/Skeleton";

/** Mirrors the draw page: back, the centred raffle header, the draw stage, the "how it works" panel. */
export default function Loading() {
  return (
    <AttendeeLayout title="">
      <SkeletonPage>
        <BackBone />
        <div className="w-full max-w-[72rem] mx-auto flex flex-col gap-8 pb-20">
          <div className="flex flex-col items-center gap-4">
            <Bone className="w-24 h-24 rounded-[16px]" />
            <TextBone className="w-24 h-4" />
            <TextBone line="h-12" className="h-[2.6rem] lg:h-[3.4rem] w-[28rem] max-w-full" strong />
            <TextBone className="w-[22rem]" />
          </div>
          <div className="flex flex-col items-center gap-6 rounded-[20px] border border-neutral-100 p-12">
            <Bone round className="w-20 h-20" />
            <TextBone className="w-64 h-[1.8rem]" strong />
            <TextBone className="w-80 max-w-full" />
            <Bone className="h-[5rem] w-[20rem]" strong />
          </div>
          <Bone className="h-[7.2rem] w-full rounded-[15px]" />
        </div>
      </SkeletonPage>
    </AttendeeLayout>
  );
}
