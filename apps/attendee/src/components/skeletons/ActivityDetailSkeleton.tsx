import { Bone, IconButtonBone, SkeletonPage, TextBone } from "./Skeleton";

/** BackButton: a 3.5rem circle and its label. */
export function BackBone() {
  return (
    <div className="flex items-center gap-4">
      <Bone round className="w-14 h-14" />
      <TextBone className="w-16" />
    </div>
  );
}

/** The 0.2rem rule between sections of the detail pages. */
export function RuleBone() {
  return <div className="bg-neutral-100 h-[0.2rem] w-full shrink-0" />;
}

/** A "Details" row: 3.5rem grey icon circle + one line of text. */
function DetailRow({ width }: { width: string }) {
  return (
    <div className="flex items-center gap-4">
      <Bone round className="w-14 h-14" />
      <TextBone className={width} />
    </div>
  );
}

function Details() {
  return (
    <div className="flex flex-col gap-8">
      <TextBone className="w-24 h-[1.4rem]" strong />
      <div className="flex items-center justify-between w-full gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Bone round className="w-14 h-14" />
          <div className="flex flex-col">
            <TextBone className="w-40" />
            <TextBone className="w-24 h-4" />
          </div>
        </div>
        <Bone className="h-[3.6rem] w-[10rem]" />
      </div>
      <DetailRow width="w-48" />
      <DetailRow width="w-56" />
      <DetailRow width="w-64" />
      <RuleBone />
      <TextBone className="w-28 h-[1.4rem]" strong />
      <Bone className="w-full aspect-[2/1] rounded-xl" />
    </div>
  );
}

/**
 * The activity pages (event, raffle, sale, restaurant): back, title, then the
 * two columns — image, share/save + the buy button, About — and the Details
 * rail (organiser, dates, place, map). On phones the rail follows About.
 */
export default function ActivityDetailSkeleton() {
  return (
    <SkeletonPage>
      <div className="flex flex-col gap-8 h-full min-h-0">
        <BackBone />
        <TextBone line="h-12 mb-4" className="h-[2.6rem] w-[26rem] max-w-full" strong />
        <div className="flex flex-col gap-12 lg:min-h-0 lg:overflow-hidden lg:h-full -mx-4 px-4">
          <div className="w-full gap-8 lg:gap-16 flex flex-col lg:grid lg:grid-cols-[29fr_23fr] lg:items-start">
            <div className="flex flex-col gap-8">
              <Bone className="w-full h-[22rem] lg:h-[298px] rounded-[10px]" />
              <div className="flex items-center justify-between">
                <div className="flex gap-8">
                  <IconButtonBone />
                  <IconButtonBone />
                </div>
                <Bone className="h-[3.5rem] w-[14rem]" strong />
              </div>
              <RuleBone />
              <div className="flex flex-col gap-4">
                <TextBone className="w-20 h-[1.4rem]" strong />
                <div className="flex flex-col">
                  <TextBone line="h-10" className="w-full h-[1.3rem]" />
                  <TextBone line="h-10" className="w-full h-[1.3rem]" />
                  <TextBone line="h-10" className="w-11/12 h-[1.3rem]" />
                  <TextBone line="h-10" className="w-2/3 h-[1.3rem]" />
                </div>
              </div>
              <div className="lg:hidden flex flex-col gap-8">
                <RuleBone />
                <Details />
              </div>
            </div>
            <aside className="hidden lg:flex flex-col gap-8">
              <Details />
            </aside>
          </div>
        </div>
      </div>
    </SkeletonPage>
  );
}
