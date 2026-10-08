import { BackBone } from "./ActivityDetailSkeleton";
import {
  ActivityCardSkeleton,
  Bone,
  IconButtonBone,
  SkeletonPage,
  TextBone,
  TitleBone,
} from "./Skeleton";

/** ListPageHeader (Upcoming, History): title, search pill, rule, bell, saved. */
export function ListHeaderSkeleton() {
  return (
    <header className="w-full flex items-center justify-between">
      <TitleBone className="w-[11rem] lg:w-[16rem]" />
      <div className="flex shrink-0 items-center gap-3 lg:gap-4">
        <Bone className="hidden lg:block w-[24.3rem] h-[4rem]" />
        <div className="w-[0.1rem] h-[1.8rem] bg-neutral-100 hidden lg:block" />
        <IconButtonBone />
        <IconButtonBone />
        <IconButtonBone className="lg:hidden" />
      </div>
    </header>
  );
}

/** Back + title, the header of the Saved and Pending purchases pages. */
export function BackTitleSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <BackBone />
      <TextBone line="h-[2.5rem] lg:h-12" className="h-[1.8rem] lg:h-[2.6rem] w-[18rem]" strong />
    </div>
  );
}

/** UpcomingCard: poster, perforation (desktop), name, date + ticket count. */
export function UpcomingCardSkeleton() {
  return (
    <div className="flex flex-row items-center lg:items-stretch lg:mb-8 lg:flex-col gap-4 w-full bg-white shadow-lg rounded-[10px] overflow-hidden pb-4 pl-4 lg:pl-0">
      <Bone className="h-62 w-62 min-w-62 lg:h-[19.1rem] lg:w-full rounded-[10px]" />
      <div className="hidden lg:block h-[0.4rem] mx-4 bg-[repeating-linear-gradient(90deg,#F1F2F3_0_2.4rem,transparent_2.4rem_3.2rem)]" />
      <div className="px-4 flex flex-1 lg:flex-auto flex-col gap-6 lg:gap-4 min-w-0">
        <TextBone line="h-[1.7rem]" className="w-3/4" strong />
        <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
          <TextBone line="h-6" className="w-28 h-4" />
          <TextBone line="h-6" className="w-20 h-4" />
        </div>
      </div>
    </div>
  );
}

/** HistoryCard: full-width poster, dash row, name, "n days ago" + stars. */
export function HistoryCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 w-full mb-8 bg-white shadow-lg rounded-[10px] overflow-hidden pb-4">
      <Bone className="w-full h-60 lg:h-[19.1rem] rounded-none" />
      <div className="w-full flex items-center justify-center gap-5 overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="bg-[#F4F4F4] rounded-[50px] h-2 w-[3.15rem] shrink-0" />
        ))}
      </div>
      <div className="p-4 flex flex-col gap-4">
        <TextBone line="h-[1.7rem]" className="w-3/4" strong />
        <div className="flex items-center justify-between">
          <TextBone line="h-6" className="w-24 h-4" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Bone key={i} round className="w-[1.5rem] h-[1.5rem]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** The pending purchase card: 15rem image, perforation, name, two short lines. */
export function PendingCardSkeleton() {
  return (
    <div className="flex flex-col bg-white rounded-[10px] overflow-hidden shadow-[0px_15px_25px_0px_rgba(0,0,0,0.05)]">
      <Bone className="h-[15rem] w-full rounded-none" />
      <div className="h-[0.4rem] mx-[1.5rem] my-[0.8rem] bg-[repeating-linear-gradient(90deg,#F1F2F3_0_2.4rem,transparent_2.4rem_3.2rem)]" />
      <div className="px-[10px] pb-[12px] flex flex-col gap-2">
        <TextBone line="h-[1.65rem]" className="w-3/4" strong />
        <TextBone line="h-6" className="w-1/2 h-4" />
        <TextBone line="h-6" className="w-24 h-4" />
      </div>
    </div>
  );
}

const CARDS = {
  upcoming: UpcomingCardSkeleton,
  history: HistoryCardSkeleton,
  activity: ActivityCardSkeleton,
  pending: PendingCardSkeleton,
};

/**
 * A list page: its header, then a grid of the card it lists. `header` picks
 * the ListPageHeader (search + bell) or the back + title one.
 */
export function ListPageSkeleton({
  card,
  header = "list",
  count = 8,
}: {
  card: keyof typeof CARDS;
  header?: "list" | "back";
  count?: number;
}) {
  const Card = CARDS[card];
  return (
    <SkeletonPage>
      {header === "list" ? <ListHeaderSkeleton /> : <BackTitleSkeleton />}
      <div className={header === "list" ? "pt-4 overflow-hidden flex flex-col gap-8 -mx-4" : ""}>
        <ul className={header === "list" ? "list px-4 pb-8" : "list pt-4"}>
          {Array.from({ length: count }).map((_, i) => (
            <li key={i} className="h-full flex">
              <Card />
            </li>
          ))}
        </ul>
      </div>
    </SkeletonPage>
  );
}

/** OrganizerCard: 6rem banner, name, activity count + Follow. */
export function OrganisationCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 w-full lg:max-w-140 bg-white shadow-lg rounded-[10px] overflow-hidden pb-4">
      <Bone className="h-60 w-full rounded-none" />
      <TextBone line="h-[1.7rem] px-4" className="w-2/3" strong />
      <div className="px-4 flex items-center justify-between gap-4">
        <TextBone line="h-6" className="w-24 h-4" />
        <Bone className="h-[3.9rem] w-[10rem]" />
      </div>
    </div>
  );
}

/** Organisations: ListPageHeader, the All / Popular / Following tabs, the card grid. */
export function OrganisationsSkeleton() {
  return (
    <SkeletonPage>
      <ListHeaderSkeleton />
      <Bone className="h-[4.6rem] w-full lg:w-[28rem]" />
      <div className="-mx-4 overflow-hidden">
        <ul className="list pt-4 px-4 pb-8 lg:pb-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="h-full flex">
              <OrganisationCardSkeleton />
            </li>
          ))}
        </ul>
      </div>
    </SkeletonPage>
  );
}
