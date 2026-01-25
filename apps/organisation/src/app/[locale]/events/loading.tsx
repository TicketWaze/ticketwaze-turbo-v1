import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
export default function Loading() {
  return (
    <OrganizerLayout
      title=""
      className="h-full w-full flex flex-col overflow-y-scroll"
    >
      <div className="flex items-center justify-between gap-8">
        <div className="bg-neutral-200 w-80 h-13 rounded-xl animate-pulse"></div>
        <div className="bg-neutral-200 w-70 h-20 rounded-[4rem] animate-pulse"></div>
      </div>
      <div>
        <div className="bg-neutral-200 h-20 w-90 rounded-[4rem] animate-pulse"></div>
      </div>

      <div className="pt-2 list-3">
        <div className="bg-neutral-200 h-110 rounded-[1rem] animate-pulse"></div>
        <div className="bg-neutral-200 h-110 rounded-[1rem] animate-pulse"></div>
        <div className="bg-neutral-200 h-110 rounded-[1rem] animate-pulse"></div>
        <div className="bg-neutral-200 h-110 rounded-[1rem] animate-pulse"></div>
        <div className="bg-neutral-200 h-110 rounded-[1rem] animate-pulse"></div>
        <div className="bg-neutral-200 h-110 rounded-[1rem] animate-pulse"></div>
      </div>
    </OrganizerLayout>
  );
}
