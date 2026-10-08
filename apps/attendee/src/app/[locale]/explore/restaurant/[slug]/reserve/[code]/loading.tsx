import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { BackBone } from "@/components/skeletons/ActivityDetailSkeleton";
import { Bone, SkeletonPage, TextBone } from "@/components/skeletons/Skeleton";

/** Mirrors ReservationCheckout: back, title + summary line, hold countdown, payment methods, totals. */
export default function Loading() {
  return (
    <AttendeeLayout title="">
      <SkeletonPage>
        <div className="flex flex-col gap-12 py-8 max-w-[720px]">
          <BackBone />
          <div className="flex flex-col gap-2">
            <TextBone line="h-12" className="h-[2.6rem] w-[24rem] max-w-full" strong />
            <TextBone className="w-[30rem] max-w-full" />
          </div>
          <Bone className="h-[6.4rem] w-full rounded-[15px]" />
          <div className="flex flex-col gap-4">
            <TextBone line="h-10" className="h-[1.8rem] w-40" strong />
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-[15px] rounded-[15px] border border-neutral-100"
              >
                <div className="flex items-center gap-4">
                  <Bone round className="w-12 h-12" />
                  <TextBone className="w-32" />
                </div>
                <TextBone className="w-20" />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 border-t border-neutral-100 pt-6">
            <div className="flex items-center justify-between">
              <TextBone className="w-24" />
              <TextBone className="w-24" />
            </div>
            <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
              <TextBone line="h-10" className="w-20 h-[1.8rem]" strong />
              <TextBone line="h-10" className="w-28 h-[1.8rem]" strong />
            </div>
          </div>
          <Bone className="h-[5rem] w-full" strong />
        </div>
      </SkeletonPage>
    </AttendeeLayout>
  );
}
