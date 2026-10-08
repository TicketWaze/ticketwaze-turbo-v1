import { Bone, SkeletonPage, TextBone } from "./Skeleton";

/** A read-only field pill of the profile form (6rem tall). */
function FieldBone({ className }: { className?: string }) {
  return <Bone className={`h-[6rem] w-full rounded-[5rem] ${className ?? ""}`} />;
}

function StatRowBone({ width = "w-40" }: { width?: string }) {
  return (
    <div className="flex items-center justify-between">
      <TextBone line="h-[2.25rem]" className={`${width} h-[1.4rem]`} />
      <TextBone className="w-10 h-[1.4rem]" strong />
    </div>
  );
}

/**
 * Profile: the TopBar (title, Referral, Edit), the orange photo card, then
 * Personal information as read-only field pills, Activities and Account.
 */
export default function ProfileSkeleton() {
  return (
    <SkeletonPage>
      <div className="flex items-center justify-between">
        <TextBone line="h-12" className="h-[2.6rem] w-[12rem]" strong />
        <div className="flex items-center gap-4">
          <Bone className="h-[3.9rem] w-[4.4rem] lg:w-[16rem]" />
          <Bone className="h-[5.4rem] w-[13.2rem]" strong />
        </div>
      </div>
      <div className="flex flex-col gap-16 w-full lg:w-212 mx-auto lg:overflow-hidden lg:h-full">
        <div className="p-12 bg-neutral-100 rounded-[30px] flex flex-col lg:flex-row items-center gap-10">
          <Bone className="w-64 h-64 rounded-[25px] lg:rounded-[50px]" strong />
          <div className="flex flex-1 flex-col items-center lg:items-start gap-8 lg:gap-[2.8rem] w-full">
            <TextBone line="h-12 lg:h-20" className="h-[2.6rem] lg:h-[4.5rem] w-[22rem] max-w-full" strong />
            <Bone className="h-[4rem] w-full" strong />
          </div>
        </div>
        <section className="flex flex-col gap-8">
          <TextBone line="h-10 mb-4" className="h-[1.8rem] w-48" strong />
          <div className="flex flex-col lg:flex-row gap-8 w-full">
            <FieldBone className="lg:flex-1" />
            <FieldBone className="lg:flex-1" />
          </div>
          <FieldBone />
          <FieldBone />
          <FieldBone />
          <div className="flex gap-8">
            <FieldBone className="flex-1" />
            <FieldBone className="flex-1" />
          </div>
          <FieldBone />
        </section>
        <section className="flex flex-col gap-10">
          <TextBone line="h-10" className="h-[1.8rem] w-36" strong />
          <StatRowBone />
          <StatRowBone width="w-48" />
          <StatRowBone width="w-36" />
        </section>
      </div>
    </SkeletonPage>
  );
}
