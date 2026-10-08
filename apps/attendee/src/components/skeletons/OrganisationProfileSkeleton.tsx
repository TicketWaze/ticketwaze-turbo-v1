import { BackBone, RuleBone } from "./ActivityDetailSkeleton";
import { ActivityCardSkeleton, Bone, IconButtonBone, SkeletonPage, TextBone } from "./Skeleton";

/** One "followers / activities" stat: grey icon circle + a short line. */
function Stat({ className }: { className?: string }) {
  return (
    <div className={`items-center gap-4 ${className ?? "flex"}`}>
      <Bone round className="h-14 w-14" />
      <TextBone className="w-20" />
    </div>
  );
}

function ActivityColumn() {
  return (
    <div className="flex flex-col gap-4">
      <TextBone className="w-40 h-[1.4rem]" strong />
      <ul className="flex flex-col gap-8">
        {[0, 1, 2].map((i) => (
          <li key={i} className="lg:pr-4">
            <ActivityCardSkeleton aside />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * An organisation's page: back, name (+ share), then banner, stats + Follow,
 * About, Contact on the left and its activities on the right (under About on
 * phones).
 */
export default function OrganisationProfileSkeleton() {
  return (
    <SkeletonPage>
      <div className="flex flex-col gap-4">
        <BackBone />
        <div className="flex items-center justify-between gap-4 mb-4">
          <TextBone line="h-12" className="h-[2.6rem] w-[24rem] max-w-full" strong />
          <IconButtonBone className="hidden lg:block" />
        </div>
      </div>
      <div className="w-full gap-8 flex flex-col lg:grid lg:grid-cols-[29fr_23fr] lg:min-h-0 lg:overflow-hidden lg:h-full">
        <div className="flex flex-col gap-8 min-h-0">
          <Bone className="w-full h-[22rem] lg:h-[29.8rem] rounded-[10px]" />
          <div className="flex items-center justify-between">
            <div className="flex gap-8">
              <Stat />
              <Stat className="hidden lg:flex" />
              <Stat className="hidden lg:flex" />
            </div>
            <Bone className="h-[3.9rem] w-[10rem]" />
          </div>
          <RuleBone />
          <div className="flex flex-col gap-4">
            <TextBone className="w-20 h-[1.4rem]" strong />
            <TextBone line="h-12" className="w-full h-[1.4rem]" />
            <TextBone line="h-12" className="w-3/4 h-[1.4rem]" />
          </div>
          <RuleBone />
          <div className="flex flex-col gap-4">
            <TextBone className="w-24 h-[1.4rem]" strong />
            <TextBone className="w-56" />
            <TextBone className="w-40" />
          </div>
          <div className="lg:hidden flex flex-col gap-8">
            <RuleBone />
            <ActivityColumn />
          </div>
        </div>
        <div className="hidden lg:flex lg:flex-col min-h-0 gap-20 overflow-hidden">
          <ActivityColumn />
        </div>
      </div>
    </SkeletonPage>
  );
}
