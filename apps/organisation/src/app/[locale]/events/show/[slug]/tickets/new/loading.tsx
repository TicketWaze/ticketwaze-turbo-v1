import OrganizerLayout from "@/components/Layouts/OrganizerLayout";

const pulse = "bg-neutral-200 animate-pulse";

/** Mirrors Create Ticket: Back, title, one ticket class card, the footer. */
export default function Loading() {
  return (
    <OrganizerLayout
      title=""
      className="h-full w-full flex flex-col overflow-hidden"
    >
      <div className="flex flex-col gap-12 h-full">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <div className={`${pulse} size-[3.5rem] rounded-full`} />
            <div className={`${pulse} w-20 h-6 rounded-lg`} />
          </div>
          <div className={`${pulse} w-[22rem] h-12 rounded-xl`} />
        </div>
        <div className="w-full max-w-[54rem] mx-auto border border-neutral-100 rounded-[1.5rem] p-6 flex flex-col gap-6">
          <div className={`${pulse} w-32 h-7 rounded-lg`} />
          <div className={`${pulse} h-[6rem] rounded-[5rem]`} />
          <div className={`${pulse} h-60 rounded-[2rem]`} />
          <div className="flex flex-col lg:flex-row gap-4">
            <div className={`${pulse} flex-1 h-[6rem] rounded-[5rem]`} />
            <div className={`${pulse} flex-1 h-[6rem] rounded-[5rem]`} />
          </div>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className={`${pulse} flex-1 h-[6rem] rounded-[5rem]`} />
            <div className={`${pulse} flex-1 h-[6rem] rounded-[5rem]`} />
          </div>
        </div>
        <div className="hidden lg:flex w-full max-w-[54rem] mx-auto gap-6 mt-auto pb-8">
          <div className={`${pulse} flex-1 h-[6rem] rounded-[10rem]`} />
          <div className={`${pulse} flex-1 h-[6rem] rounded-[10rem]`} />
        </div>
      </div>
    </OrganizerLayout>
  );
}
