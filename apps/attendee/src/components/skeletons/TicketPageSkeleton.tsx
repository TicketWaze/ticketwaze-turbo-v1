import { BackBone, RuleBone } from "./ActivityDetailSkeleton";
import { Bone, IconButtonBone, SkeletonPage, TextBone } from "./Skeleton";

/** The ticket (UpcomingTicket, 500 / 681px tall) and its pager + download row. */
function TicketBone() {
  return (
    <div className="flex flex-col gap-4">
      <Bone className="w-full h-[500px] lg:h-[681px] rounded-[10px]" />
      <div className="border border-neutral-100 rounded-[100px] py-4 px-[1.5rem] flex justify-between items-center">
        <div className="flex items-center gap-[18px]">
          <Bone round className="w-[35px] h-[35px]" />
          <Bone className="w-12 h-[2rem]" strong />
          <Bone round className="w-[35px] h-[35px]" />
        </div>
        <Bone className="h-[3.5rem] w-[14rem]" />
      </div>
    </div>
  );
}

/**
 * A held ticket (Upcoming → one activity): back, title + organiser row with
 * View profile, then the poster / actions / map column and the ticket column.
 * On phones the ticket follows the poster. `past` is the History version:
 * the star rating + Rate button under the poster, a review card instead of
 * the map.
 */
export default function TicketPageSkeleton({ past = false }: { past?: boolean }) {
  return (
    <SkeletonPage>
      <BackBone />
      <div className="grid grid-cols-1 lg:grid-cols-[29fr_23fr] w-full">
        <TextBone line="h-12 mb-4" className="h-[2.6rem] w-[24rem] max-w-full" strong />
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Bone round className="w-14 h-14" />
            <TextBone className="w-36" />
          </div>
          <Bone className="h-[3.9rem] w-[13rem]" />
        </div>
      </div>
      <div className="w-full gap-8 flex flex-col lg:grid lg:grid-cols-[29fr_23fr] lg:min-h-0 lg:overflow-hidden lg:h-full">
        <div className="flex flex-col gap-8 min-h-0">
          <Bone className="w-full h-[22rem] lg:h-[298px] rounded-[10px]" />
          {past ? (
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Bone key={i} round className="w-[2.4rem] h-[2.4rem]" />
                ))}
              </div>
              <Bone className="h-[4.2rem] w-[13rem]" strong />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex gap-8">
                <IconButtonBone />
                <IconButtonBone />
              </div>
              <IconButtonBone />
            </div>
          )}
          <div className="lg:hidden">
            <TicketBone />
          </div>
          <RuleBone />
          {past ? (
            <div className="flex flex-col gap-4">
              <TextBone line="h-9" className="w-40 h-[1.6rem]" strong />
              <TextBone line="h-12" className="w-full h-[1.4rem]" />
              <TextBone line="h-12" className="w-2/3 h-[1.4rem]" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <TextBone className="w-28 h-[1.4rem]" strong />
                <TextBone className="w-16" />
              </div>
              <Bone className="w-full aspect-[2/1] rounded-xl" />
            </>
          )}
        </div>
        <div className="hidden lg:flex flex-col gap-2">
          <TicketBone />
        </div>
      </div>
    </SkeletonPage>
  );
}
